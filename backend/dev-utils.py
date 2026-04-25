import typer
import asyncio
import json
from minio import Minio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from rich.console import Console
from rich.panel import Panel

from app.database.models.base import Base
from app.core.config import config

"""
HELP

python.exe .\dev-utils.py --help

python.exe .\dev-utils.py db --help
python.exe .\dev-utils.py storage --help
"""

console = Console()
app = typer.Typer(
    help="[bold][red]UniThread Command Center[/red][/bold]",
    rich_markup_mode="rich",
    add_completion=False, 
    no_args_is_help=True   
)

db_app = typer.Typer(help="Gestionare Baza de Date [italic](\"db --help\" sub-comenzi)[/italic]", add_completion=False)
st_app = typer.Typer(help="Gestionare Stocare [italic](\"storage --help\" sub-comenzi)[/italic]", add_completion=False)

app.add_typer(db_app, name="db")
app.add_typer(st_app, name="storage")

DB_URL = config.DATABASE_URL

async def run_db_op(func):
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        await func(conn)
    await engine.dispose()

@db_app.command("create-tables")
def db_create():
    """Creeaza tabelele lipsa din baza de date."""
    async def _op(conn):
        await conn.run_sync(Base.metadata.create_all)
    asyncio.run(run_db_op(_op))
    console.print("[bold green][SUCCESS] Schema DB creata.[/bold green]")

@db_app.command("delete-tables")
def db_delete(force: bool = typer.Option(False, "--force", "-f", help="Skip confirm")):
    """Sterge complet structura bazei de date."""
    if force or typer.confirm("[WARNING] Stergi toata structura DB. Continuam?"):
        async def _op(conn):
            await conn.run_sync(Base.metadata.drop_all)
        asyncio.run(run_db_op(_op))
        console.print("[bold red][DELETED] Schema DB stearsa.[/bold red]")

@db_app.command("clear-data")
def db_clear(force: bool = typer.Option(False, "--force", "-f", help="Skip confirm")):
    """Goleste datele tabelelor (pastreaza schema)."""
    if force or typer.confirm("[WARNING] Golesti toate datele din DB. Continuam?"):
        async def _op(conn):
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
        asyncio.run(run_db_op(_op))
        console.print("[bold yellow][CLEARED] DB golit de date.[/bold yellow]")

@db_app.command("reset")
def db_reset(force: bool = typer.Option(False, "--force", "-f", help="Skip confirm")):
    """Recreeaza schema DB de la zero."""
    if force or typer.confirm("[WARNING] Recreezi DB de la zero. Continuam?"):
        db_delete(force=True)
        db_create()
        console.print("[bold blue][RESET] DB recreat din stadiul initial.[/bold blue]")

S3_CONFIG = {
    "endpoint": config.MINIO_ENDPOINT, 
    "access_key": config.MINIO_ACCESS_KEY, 
    "secret_key": config.MINIO_SECRET_KEY, 
    "secure": config.MINIO_SECURE
}
BUCKETS = {
    "user-assets": "public",
    "community-assets": "public",
    "post-assets": "public",
    "marketplace-assets": "public",
    "academic-library": "private"
}

@st_app.command("init-buckets")
def st_init():
    """Initializeaza bucket-urile si politicile MinIO."""
    client = Minio(**S3_CONFIG)
    for bucket, mode in BUCKETS.items():
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        
        if mode == "public":
            policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetBucketLocation", "s3:ListBucket", "s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket}", f"arn:aws:s3:::{bucket}/*"]
                }]
            }
            client.set_bucket_policy(bucket, json.dumps(policy))
    console.print("[bold green][SUCCESS] MinIO pregatit si securizat.[/bold green]")

@st_app.command("delete-files")
def st_delete(force: bool = typer.Option(False, "--force", "-f", help="Skip confirm")):
    """Sterge toate fisierele din MinIO."""
    if force or typer.confirm("[WARNING] Stergi toate fisierele. Continuam?"):
        client = Minio(**S3_CONFIG)
        for bucket in BUCKETS.keys():
            if client.bucket_exists(bucket):
                objects = client.list_objects(bucket, recursive=True)
                for obj in objects:
                    client.remove_object(bucket, obj.object_name)
        console.print("[bold red][DELETED] Toate fisierele au fost sterse.[/bold red]")

@app.command("reset-all")
def reset_all(force: bool = typer.Option(False, "--force", "-f", help="Skip confirm")):
    """Wipe total: Recreeaza DB si goleste fisierele din MinIO."""
    console.print(Panel("[bold red][NUCLEAR RESET] UniThread Ecosystem[/bold red]", expand=False))
    
    if force or typer.confirm("[WARNING] ATENTIE: Stergi DB si Fisierele! Sigur?"):
        db_delete(force=True)
        db_create()
        
        st_delete(force=True)
        st_init()
        
        console.print("\n[bold green][READY] Sistem complet resetat. Gata de start![/bold green]")

if __name__ == "__main__":
    app()