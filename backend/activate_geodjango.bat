@echo off
REM GeoDjango 환경 설정 스크립트

REM OSGeo4W 환경변수 설정
set OSGEO4W_ROOT=G:\OSGeo4W
set GDAL_DATA=%OSGEO4W_ROOT%\share\gdal
set PROJ_LIB=%OSGEO4W_ROOT%\share\proj
set GDAL_DRIVER_PATH=%OSGEO4W_ROOT%\bin\gdalplugins

REM PATH에 OSGeo4W 추가
set PATH=%OSGEO4W_ROOT%\bin;%PATH%

REM 가상환경 활성화
call venv\Scripts\activate.bat

echo GeoDjango 환경이 활성화되었습니다.
echo GDAL_LIBRARY_PATH: G:\OSGeo4W\bin\gdal310.dll
echo GEOS_LIBRARY_PATH: G:\OSGeo4W\bin\geos_c.dll








