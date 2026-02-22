import { useState } from "react";
import { useEmployees, useCreateEmployee } from "@/hooks/use-employees";
import { useTasks, useCreateTask } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Users, Briefcase, Plus, Search, Calendar as CalendarIcon, 
  CheckCircle2, Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertTaskSchema } from "@shared/schema";
import { motion } from "framer-motion";

// --- Components ---

function EmployeeList() {
  const { data: employees, isLoading } = useEmployees();
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">جاري تحميل الموظفين...</div>;

  const filtered = employees?.filter(e => 
    e.role === 'employee' && 
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث عن موظف..." 
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <AddEmployeeDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered?.map((employee, idx) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-border/60 overflow-hidden group">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/40" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                    <AvatarImage src={employee.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {employee.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-primary transition-colors">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">@{employee.username}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {employee.bio || "لا يوجد نبذة تعريفية"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateEmployee();
  
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      bio: "",
      role: "employee" as const,
      avatarUrl: "",
    }
  });

  const onSubmit = (data: any) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> إضافة موظف
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="محمد أحمد" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>اسم المستخدم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>كلمة المرور</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>{isPending ? "جاري الحفظ..." : "حفظ البيانات"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TaskList() {
  const { data: tasks, isLoading } = useTasks();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">جاري تحميل المهام...</div>;
  const filtered = tasks?.filter(t => filter === "all" || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {f === "all" ? "الكل" : f === "pending" ? "قيد التنفيذ" : "مكتملة"}
            </button>
          ))}
        </div>
        <AddTaskDialog />
      </div>

      <div className="grid gap-4">
        {filtered?.map((task, idx) => (
          <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                <div className={`p-3 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h3>
                    <Badge variant={task.status === 'completed' ? "outline" : "default"}>{task.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{task.description}</p>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{task.dueDate ? format(new Date(task.dueDate), "d MMMM yyyy", { locale: ar }) : "بدون تاريخ"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AddTaskDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateTask();
  const { data: employees } = useEmployees();
  
  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date().toISOString().split('T')[0],
      assigneeId: undefined,
      status: "pending" as const,
    }
  });

  const onSubmit = (data: any) => {
    mutate(data, { onSuccess: () => { setOpen(false); form.reset(); } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20"><Plus className="h-4 w-4" /> مهمة جديدة</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>تعيين مهمة جديدة</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>عنوان المهمة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>التفاصيل</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem><FormLabel>التاريخ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="assigneeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>الموظف</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر موظف" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.filter(e => e.role === 'employee').map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>{isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const { data: user } = useUser();
  const [activeTab, setActiveTab] = useState("employees");

  return (
    <div className="space-y-8" dir="rtl">
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold">مرحباً، {user?.name} 👋</h2>
          <p className="opacity-90 text-sm">أهلاً بك في لوحة تحكم Dark</p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="employees" className="gap-2"><Users className="w-4 h-4" /> الموظفين</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2"><Briefcase className="w-4 h-4" /> المهام</TabsTrigger>
        </TabsList>
        <TabsContent value="employees"><EmployeeList /></TabsContent>
        <TabsContent value="tasks"><TaskList /></TabsContent>
      </Tabs>
    </div>
  );
}
