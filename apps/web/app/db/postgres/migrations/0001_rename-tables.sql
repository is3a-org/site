-- Custom SQL migration file, put your code below! --
ALTER TABLE "session_simple-auth-db" RENAME TO "session_simple_auth_db";
ALTER TABLE "user_simple-auth-db" RENAME TO "user_simple_auth_db";