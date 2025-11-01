import EmployeeAttendanceDetail from "@/components/hr/employee-attendance-detail";

export default function HREmployeeDetailPage({ params }: { params: { id: string } }) {
  return <EmployeeAttendanceDetail employeeId={params.id} />;
}
