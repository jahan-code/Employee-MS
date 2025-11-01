import EmployeeAttendanceDetail from "@/components/hr/employee-attendance-detail";

export default async function HREmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeAttendanceDetail employeeId={id} />;
}
