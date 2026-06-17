@echo off
echo Starting SkillBeacon repository cleanup...

:: Delete files in root
for %%f in (
    build.log
    build_error.log
    build_out.log
    apify_data.json
    live_apify_data.json
    find-working-model.mjs
    fix_json.cjs
    test-gemini.js
    test-gemini.mjs
    test_risk_score.py
) do (
    if exist "%%f" (
        echo Deleting file: %%f
        del /f /q "%%f"
    )
)

:: Delete files in backend
for %%f in (
    backend\build.log
    backend\build2.log
    backend\build2.txt
    backend\build2_utf8.log
    backend\build3.log
    backend\build3_utf8.log
    backend\build4.log
    backend\build4_utf8.log
    backend\build6.log
    backend\build6_utf8.log
    backend\build_output.txt
    backend\build_utf8.log
    backend\compile_errors.txt
    backend\run_log.txt
    backend\run_output.txt
    backend\startup.log
    backend\maven.zip
    backend\db_del.js
    backend\db_test.js
    backend\delete_jobs.js
    backend\fetch.js
    backend\fetchData.js
) do (
    if exist "%%f" (
        echo Deleting file: %%f
        del /f /q "%%f"
    )
)

:: Delete folders
for %%d in (
    backend\apache-maven-3.9.6
    backend\target
    stitch
) do (
    if exist "%%d" (
        echo Deleting directory: %%d
        rmdir /s /q "%%d"
    )
)

:: Delete the powershell script too if it exists
if exist "cleanup.ps1" (
    del /f /q "cleanup.ps1"
)

echo Cleanup complete!
pause
