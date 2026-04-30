# Instrucțiuni de pornire backend

Urmează pașii de mai jos pentru a porni backend-ul (pe Windows PowerShell):

1. Creează și activează mediul virtual

```powershell
python -m venv venv
.\venv\Scripts\Activate
```

2. Instalează dependențele

```powershell
pip install -r requirements.txt
```

3. Creează baza de date (din directorul `backend`)

```powershell
# asigură-te că ești în folderul backend și mediul virtual e activ
python dev-utils.py db create-tables
```

4. Pornește serverul (din directorul `backend`)

```powershell
fastapi dev
```

Note:
- Rulează comenzile din folderul `backend`.
- Asigură-te că mediul virtual este activ înainte de `pip install`, crearea bazei și pornirea serverului.

