@echo off
echo ================================
echo Job Portal Deployment Script
echo ================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from template...
    (
        echo NODE_ENV=production
        echo PORT=8000
        echo MONGODB_URI=mongodb://admin:password123@mongodb:27017/jobportal?authSource=admin
        echo REDIS_URL=redis://redis:6379
        echo JWT_SECRET=change-this-secret-key
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Cloudinary
        echo CLOUDINARY_CLOUD_NAME=your-cloud-name
        echo CLOUDINARY_API_KEY=your-api-key
        echo CLOUDINARY_API_SECRET=your-api-secret
    ) > .env
    echo [OK] .env file created. Please update with your credentials.
    echo.
)

REM Stop existing containers
echo Stopping existing containers...
docker-compose down

REM Build and start containers
echo Building and starting containers...
docker-compose up -d --build

REM Wait for services
timeout /t 10 /nobreak >nul

REM Check if services are running
docker ps | findstr "jobportal-backend" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is running
) else (
    echo [ERROR] Backend failed to start
    docker-compose logs backend
    exit /b 1
)

docker ps | findstr "jobportal-frontend" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend is running
) else (
    echo [ERROR] Frontend failed to start
    docker-compose logs frontend
    exit /b 1
)

echo.
echo ================================
echo Deployment successful!
echo ================================
echo.
echo Access your application:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/api-docs
echo   Health:   http://localhost:8000/api/v1/monitoring/health
echo.
echo To view logs:
echo   docker-compose logs -f backend
echo   docker-compose logs -f frontend
echo.
echo To stop:
echo   docker-compose down
echo.
pause
