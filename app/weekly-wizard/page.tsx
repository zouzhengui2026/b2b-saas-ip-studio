"use client"

import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { GenerateWeeklyWizard } from "@/components/generate-weekly-wizard"

export default function WeeklyWizardPage() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <PageHeader
        title="本周选题向导"
        breadcrumbs={[{ label: "内容工单", href: "/contents" }, { label: "本周选题向导" }]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        }
      />

      <div className="mt-4">
        <GenerateWeeklyWizard onFinished={() => router.push("/contents")} />
      </div>
    </DashboardLayout>
  )
}


