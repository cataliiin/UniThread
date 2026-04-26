from __future__ import annotations

from datetime import datetime, timezone

from jose import jwt
from urllib3.exceptions import MaxRetryError

from app.core.config import config
from app.core import storage as storage_module


def _login(client, user: dict[str, object]):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user["email"],
            "password": user["password"],
        },
    )
    assert response.status_code == 200
    return response


def _make_signed_token(sub: str, username: str = "alice") -> str:
    now = int(datetime.now(timezone.utc).timestamp())
    payload = {
        "sub": sub,
        "username": username,
        "iat": now,
        "exp": now + 300,
    }
    return jwt.encode(
        payload,
        config.JWT_SECRET_KEY,
        algorithm=config.JWT_ALGORITHM,
    )


def test_login_generates_integer_iat_and_exp_claims(client, seeded_user):
    response = _login(client, seeded_user)

    token = response.json()["access_token"]
    claims = jwt.decode(
        token,
        config.JWT_SECRET_KEY,
        algorithms=[config.JWT_ALGORITHM],
    )

    now = int(datetime.now(timezone.utc).timestamp())

    assert isinstance(claims["iat"], int)
    assert isinstance(claims["exp"], int)
    assert claims["exp"] - claims["iat"] == config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    assert abs(claims["iat"] - now) < 10


def test_users_me_rejects_invalid_uuid_sub_claim(client, seeded_user):
    invalid_uuid_token = _make_signed_token(
        sub="not-a-valid-uuid",
        username=seeded_user["username"],
    )
    client.cookies.set("access_token", invalid_uuid_token)

    response = client.get("/api/v1/users/me")

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "HTTP_ERROR",
            "message": "Could not validate credentials",
            "details": None,
        }
    }


def test_presigned_url_returns_503_when_minio_is_unreachable(
    client,
    seeded_user,
    monkeypatch,
):
    _login(client, seeded_user)

    def raise_max_retry_error(*args, **kwargs):
        raise MaxRetryError(
            None,
            "http://localhost:9000",
            OSError("connection refused"),
        )

    monkeypatch.setattr(
        storage_module.minio_client,
        "presigned_put_object",
        raise_max_retry_error,
    )

    response = client.post(
        "/api/v1/storage/presigned-url",
        json={"bucket_name": "user-assets"},
    )

    assert response.status_code == 503
    assert response.json() == {
        "error": {
            "code": "STORAGE_UNAVAILABLE",
            "message": "Storage service is currently unavailable. Please try again later.",
            "details": None,
        }
    }
