-- CreateTable
CREATE TABLE "ScenarioStep" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,

    CONSTRAINT "ScenarioStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "browsers" TEXT[],
    "device" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScenarioStep" ADD CONSTRAINT "ScenarioStep_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
