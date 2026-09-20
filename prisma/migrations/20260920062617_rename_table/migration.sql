/*
  Warnings:

  - You are about to drop the column `scenarioId` on the `tbl_scenario_steps` table. All the data in the column will be lost.
  - Added the required column `scenario_id` to the `tbl_scenario_steps` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tbl_scenario_steps" DROP CONSTRAINT "tbl_scenario_steps_scenarioId_fkey";

-- AlterTable
ALTER TABLE "tbl_scenario_steps" DROP COLUMN "scenarioId",
ADD COLUMN     "scenario_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "tbl_scenario_steps" ADD CONSTRAINT "tbl_scenario_steps_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "tbl_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
