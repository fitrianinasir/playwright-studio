/*
  Warnings:

  - You are about to drop the `Scenario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScenarioStep` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ScenarioStep" DROP CONSTRAINT "ScenarioStep_scenarioId_fkey";

-- DropTable
DROP TABLE "Scenario";

-- DropTable
DROP TABLE "ScenarioStep";

-- CreateTable
CREATE TABLE "tbl_scenario_steps" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,

    CONSTRAINT "tbl_scenario_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "browsers" TEXT[],
    "device" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_scenarios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_scenario_steps" ADD CONSTRAINT "tbl_scenario_steps_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "tbl_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
