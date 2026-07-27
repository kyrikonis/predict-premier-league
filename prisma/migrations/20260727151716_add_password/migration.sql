/*
  Warnings:

  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

  Switching to real username+password accounts: there is no way to attach a password to existing
  passwordless accounts, so existing users and their predictions are intentionally wiped here
  (confirmed with the app owner). Round/Fixture data is untouched.
*/
-- Wipe existing passwordless accounts and their predictions (Round/Fixture data is untouched)
DELETE FROM "Prediction";
DELETE FROM "User";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT NOT NULL;
