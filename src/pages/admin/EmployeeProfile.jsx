import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Phone, Mail, MapPin, Calendar, Briefcase, Upload, FileText, Trash2, Plane, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { empName, fmtDate, STATUS_COLORS, logAudit } from "@/lib/hr";

function Field({ label, value }) {
  return (
    <div>
      <div className="font-mono text-[10px] text-navy-300 tracking-wider uppercase">{label}</div>
      <div className="text-navy-500 text-sm mt-0.5">{value || "—"}</div>
    </div>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [leave, setLeave] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", category: "Contract" });
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Employee.filter({ id }, "-created_date", 1).then(r => r[0] || null),
      base44.entities.Document.filter({ related_entity_id: id }, "-created_date", 50).catch(() => []),
      base44.entities.LeaveRequest.filter({ employee_id: id }, "-created_date", 50).catch(() => []),
      base44.entities.Attendance.filter({ employee_id: id }, "-date", 30).catch(() => []),
    ]).then(([e, docs, lr, att]) => { setEmp(e); setDocuments(docs); setLeave(lr); setAttendance(att); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const uploadDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !docForm.name) { toast({ title: "Enter a document name first", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document.create({ name: docForm.name, category: docForm.category, file_url, related_entity_id: id, related_entity_type: "Employee" });
      await logAudit({ action: "Uploaded employee document", module: "Employees", record: empName(emp) });
      toast({ title: "Document uploaded" });
      setDocForm({ name: "", category: "Contract" });
      load();
    } catch (err) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const deleteDoc = async (d) => {
    await base44.entities.Document.delete(d.id);
    toast({ title: "Document deleted" });
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  if (!emp) return <div className="text-center py-20"><p className="text-navy-300">Employee not found</p><Link to="/admin/employees" className="text-gold text-sm hover:underline mt-2 inline-block">Back to employees</Link></div>;

  return (
    <div>
      <Link to="/admin/employees" className="inline-flex items-center text-navy-400 hover:text-gold text-sm mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Employees</Link>

      {/* Header */}
      <div className="bg-white border border-navy-100 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-navy-500 text-gold flex items-center justify-center font-display font-black text-2xl">{(emp.first_name?.[0] || "") + (emp.last_name?.[0] || "")}</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl text-navy-500">{empName(emp)}</h1>
            <p className="text-navy-300 text-sm">{emp.job_title || "—"} · {emp.department || "Unassigned"}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-navy-400">
              {emp.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {emp.email}</span>}
              {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {emp.phone}</span>}
              {emp.work_location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {emp.work_location}</span>}
            </div>
          </div>
          <span className={`px-3 py-1.5 text-xs font-mono font-bold rounded ${STATUS_COLORS[emp.employment_status]}`}>{emp.employment_status}</span>
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="bg-white border border-navy-100 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Field label="Employee ID" value={emp.employee_id} />
            <Field label="First Name" value={emp.first_name} />
            <Field label="Middle Name" value={emp.middle_name} />
            <Field label="Last Name" value={emp.last_name} />
            <Field label="Date of Birth" value={fmtDate(emp.date_of_birth)} />
            <Field label="Gender" value={emp.gender} />
            <Field label="Nationality" value={emp.nationality} />
            <Field label="Phone" value={emp.phone} />
            <Field label="Email" value={emp.email} />
            <Field label="Address" value={emp.address} />
          </div>
          <h4 className="font-mono text-[10px] text-gold tracking-widest uppercase mt-6 mb-3">Emergency Contact</h4>
          <div className="grid grid-cols-3 gap-5">
            <Field label="Name" value={emp.emergency_contact_name} />
            <Field label="Phone" value={emp.emergency_contact_phone} />
            <Field label="Relationship" value={emp.emergency_contact_relation} />
          </div>
        </TabsContent>

        <TabsContent value="employment" className="bg-white border border-navy-100 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Field label="Job Title" value={emp.job_title} />
            <Field label="Department" value={emp.department} />
            <Field label="Employment Type" value={emp.employment_type} />
            <Field label="Employment Status" value={emp.employment_status} />
            <Field label="Date Joined" value={fmtDate(emp.date_joined)} />
            <Field label="Contract Start" value={fmtDate(emp.contract_start)} />
            <Field label="Contract End" value={fmtDate(emp.contract_end)} />
            <Field label="Supervisor" value={emp.supervisor_name} />
            <Field label="Work Location" value={emp.work_location} />
            {emp.salary != null && <Field label="Salary" value={`R ${Number(emp.salary).toLocaleString()}`} />}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="bg-white border border-navy-100 rounded-lg p-6">
          <div className="flex items-end gap-3 mb-5 flex-wrap">
            <div><Label className="text-xs text-navy-400">Document Name</Label><Input value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} className="mt-1 w-48" /></div>
            <div><Label className="text-xs text-navy-400">Category</Label><Select value={docForm.category} onValueChange={v => setDocForm({ ...docForm, category: v })}><SelectTrigger className="mt-1 w-40"><SelectValue /></SelectTrigger><SelectContent>{["ID Document","Contract","Qualification","Certificate","Insurance","Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <Label className="cursor-pointer">
              <input type="file" className="hidden" onChange={uploadDoc} disabled={uploading} />
              <span className="inline-flex items-center px-4 py-2 bg-gold text-navy-500 font-heading font-bold text-sm rounded hover:bg-gold-300">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Upload
              </span>
            </Label>
          </div>
          {documents.length === 0 ? <p className="text-navy-300 text-sm py-6 text-center">No documents uploaded</p> : (
            <div className="space-y-2">
              {documents.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 border border-navy-50 rounded-lg hover:bg-steel-50">
                  <FileText className="w-5 h-5 text-navy-300" />
                  <div className="flex-1 min-w-0">
                    <a href={d.file_url} target="_blank" rel="noreferrer" className="font-heading font-bold text-navy-500 text-sm hover:text-gold">{d.name}</a>
                    <div className="text-navy-300 text-xs">{d.category}{d.expiry_date ? ` · Expires ${fmtDate(d.expiry_date)}` : ""}</div>
                  </div>
                  <button onClick={() => deleteDoc(d)} className="p-1.5 text-navy-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leave" className="bg-white border border-navy-100 rounded-lg p-6">
          {leave.length === 0 ? <p className="text-navy-300 text-sm py-6 text-center">No leave records</p> : (
            <div className="space-y-2">
              {leave.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 border border-navy-50 rounded-lg">
                  <Plane className="w-5 h-5 text-navy-300" />
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-navy-500 text-sm">{l.leave_type}</div>
                    <div className="text-navy-300 text-xs">{fmtDate(l.start_date)} → {fmtDate(l.end_date)} · {l.days} day{l.days !== 1 ? "s" : ""}</div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="bg-white border border-navy-100 rounded-lg p-6">
          {attendance.length === 0 ? <p className="text-navy-300 text-sm py-6 text-center">No attendance records</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-steel-100 text-left">
                  <th className="px-3 py-2 font-mono text-[10px] text-navy-400 uppercase">Date</th>
                  <th className="px-3 py-2 font-mono text-[10px] text-navy-400 uppercase">Clock In</th>
                  <th className="px-3 py-2 font-mono text-[10px] text-navy-400 uppercase">Clock Out</th>
                  <th className="px-3 py-2 font-mono text-[10px] text-navy-400 uppercase">Hours</th>
                  <th className="px-3 py-2 font-mono text-[10px] text-navy-400 uppercase">Status</th>
                </tr></thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.id} className="border-t border-navy-50">
                      <td className="px-3 py-2 text-navy-500 font-mono text-xs">{fmtDate(a.date)}</td>
                      <td className="px-3 py-2 text-navy-400 font-mono text-xs">{a.clock_in || "—"}</td>
                      <td className="px-3 py-2 text-navy-400 font-mono text-xs">{a.clock_out || "—"}</td>
                      <td className="px-3 py-2 text-navy-400 font-mono text-xs">{a.total_hours || "—"}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-steel-200 text-navy-500">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}