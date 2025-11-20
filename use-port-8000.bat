@echo off
REM 快速修改 Nginx 使用 8000 端口

echo.
echo ========================================
echo   Nginx 端口修改 (80 -> 8000)
echo ========================================
echo.

set CONFIG_FILE=%cd%\nginx.conf

if not exist "%CONFIG_FILE%" (
    echo [错误] 未找到 nginx.conf
    pause
    exit /b 1
)

echo [*] 正在备份原配置文件...
copy "%CONFIG_FILE%" "%CONFIG_FILE%.bak" >nul
echo [✓] 已备份: nginx.conf.bak

echo [*] 正在修改配置文件...

REM 使用 PowerShell 修改配置
powershell -Command "^
    $file = '%CONFIG_FILE%'; ^
    $content = Get-Content $file -Raw; ^
    $content = $content -replace 'listen 80;', 'listen 8000;'; ^
    $content | Set-Content $file; ^
    Write-Host '[✓] 已修改 Nginx 配置'
"

echo.
echo ========================================
echo   配置已更新
echo ========================================
echo.
echo 新的访问地址：
echo   前端: http://localhost:8000
echo   API:  http://localhost:8000/api
echo.
echo 下一步：
echo   1. 运行 start-nginx.bat 启动 Nginx
echo   2. 访问 http://localhost:8000
echo.
echo ========================================
echo.
pause
