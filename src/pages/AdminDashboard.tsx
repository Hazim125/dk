import { useState } from "react";
import { useEmployees, useCreateEmployee } from "@/hooks/use-employees";
import { useTasks, useCreateTask } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Users, Briefcase, Plus, Search, Calendar as CalendarIcon, 
  MoreVertical, CheckCircle2, Circle, Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertTaskSchema } from "@shared/schema";
import { z } from "zod";
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
                <div className="flex items-start justify-between">
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
        {filtered?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-muted">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا يوجد موظفين مطابقين للبحث</p>
          </div>
        )}
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
        <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          إضافة موظف
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl><Input placeholder="محمد أحمد" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl><Input placeholder="mohamed2024" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl><Input type="password" placeholder="******" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نبذة تعريفية</FormLabel>
                  <FormControl><Textarea placeholder="مطور واجهات أمامية..." className="resize-none" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الصورة الشخصية (اختياري)</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الحفظ..." : "حفظ البيانات"}
              </Button>
            </div>
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === f 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "الكل" : f === "pending" ? "قيد التنفيذ" : "مكتملة"}
            </button>
          ))}
        </div>
        <AddTaskDialog />
      </div>

      <div className="grid gap-4">
        {filtered?.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className={`p-3 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    <Badge variant={task.status === 'completed' ? "outline" : "default"} className={task.status === 'pending' ? "bg-orange-500 hover:bg-orange-600" : ""}>
                      {task.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{task.description}</p>
                </div>

                <div className="flex flex-col sm:items-end gap-2 min-w-[150px]">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{format(new Date(task.dueDate), "d MMMM yyyy", { locale: ar })}</span>
                  </div>
                  {task.assignee && (
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{task.assignee.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span>{task.assignee.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
         {filtered?.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed rounded-xl border-muted">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا توجد مهام في هذه القائمة</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AddTaskDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateTask();
  const { data: employees } = useEmployees();
  
  // Custom schema to handle date coercion if needed, though react-hook-form usually handles dates as objects or strings
  // We need to ensure dueDate is sent as ISO string or Date object
  const taskFormSchema = insertTaskSchema.extend({
    assigneeId: z.coerce.number(),
    dueDate: z.coerce.date(),
  });

  const form = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date().toISOString().split('T')[0], // Default to today YYYY-MM-DD for input type=date
      assigneeId: "",
      status: "pending" as const,
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
        <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          مهمة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تعيين مهمة جديدة</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان المهمة</FormLabel>
                  <FormControl><Input placeholder="تحديث التقرير الشهري" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التفاصيل</FormLabel>
                  <FormControl><Textarea placeholder="تفاصيل المهمة..." className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الاستحقاق</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعيين إلى</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موظف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.filter(e => e.role === 'employee').map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page ---

export default function AdminDashboard() {
  const { data: user } = useUser();
  const [activeTab, setActiveTab] = useState("employees");

  return (
    <div className="space-y-8">
      {/* Header Stats / Welcome */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-1">مرحباً، {user?.name}</h2>
            <p className="opacity-90">لوحة تحكم المشرف</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الموظفين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <EmployeeCount />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المهام النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <TaskCount />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="employees" className="gap-2 px-6">
              <Users className="w-4 h-4" />
              إدارة الموظفين
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 px-6">
              <Briefcase className="w-4 h-4" />
              إدارة المهام
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="employees" className="mt-0">
          <EmployeeList />
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-0">
          <TaskList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmployeeCount() {
  const { data } = useEmployees();
  return <span>{data?.filter(u => u.role === 'employee').length || 0}</span>;
}

function TaskCount() {
  const { data } = useTasks();
  return <span>{data?.filter(t => t.status === 'pending').length || 0}</span>;
}
