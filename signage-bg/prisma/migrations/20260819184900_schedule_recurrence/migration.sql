-- CreateEnum (MySQL emulates enums as inline column definitions)
-- AlterTable
ALTER TABLE `schedules`
  ADD COLUMN `recurrence` ENUM('ONCE', 'DAILY') NOT NULL DEFAULT 'ONCE',
  ADD COLUMN `recurrenceUntil` DATETIME(3) NULL;
