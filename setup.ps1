# ==========================================
# Setup do ambiente no Windows (PowerShell)
# Uso:  .\setup.ps1
# ==========================================
$ErrorActionPreference = "Stop"

Write-Host "==> Criando ambiente virtual (.venv) com o Python do Windows..." -ForegroundColor Cyan
python -m venv .venv

Write-Host "==> Ativando o ambiente..." -ForegroundColor Cyan
. .\.venv\Scripts\Activate.ps1

Write-Host "==> Atualizando pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

Write-Host "==> Instalando dependencias (pode demorar; baixa o torch CPU)..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host ""
Write-Host "Pronto! Para rodar a API:" -ForegroundColor Green
Write-Host "  . .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "  uvicorn rag:app --reload" -ForegroundColor Yellow
