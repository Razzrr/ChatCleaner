@echo off
echo =====================================
echo   Discord Chat Cleaner - Test Suite
echo =====================================
echo.

:menu
echo Select test option:
echo 1. Run all tests
echo 2. Run unit tests only
echo 3. Run integration tests only
echo 4. Run end-to-end tests only
echo 5. Run tests with coverage report
echo 6. Run tests in watch mode
echo 7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto all
if "%choice%"=="2" goto unit
if "%choice%"=="3" goto integration
if "%choice%"=="4" goto e2e
if "%choice%"=="5" goto coverage
if "%choice%"=="6" goto watch
if "%choice%"=="7" goto end

echo Invalid choice. Please try again.
echo.
goto menu

:all
echo.
echo Running all tests...
npm test
goto prompt

:unit
echo.
echo Running unit tests...
npm run test:unit
goto prompt

:integration
echo.
echo Running integration tests...
npm run test:integration
goto prompt

:e2e
echo.
echo Running end-to-end tests...
npm run test:e2e
goto prompt

:coverage
echo.
echo Running tests with coverage...
npm run test:coverage
echo.
echo Coverage report saved in ./coverage directory
goto prompt

:watch
echo.
echo Starting test watch mode (Press Ctrl+C to exit)...
npm run test:watch
goto prompt

:prompt
echo.
echo Press any key to return to menu...
pause > nul
echo.
goto menu

:end
echo.
echo Exiting test suite...
exit /b 0