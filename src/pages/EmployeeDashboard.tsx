import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CheckCircle2, Clock, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function EmployeeDashboard() {
  const { data: user } = useUser();
  const { data: tasks, isLoading } = useTasks();
  const { mutate: updateTask, isPending } = useUpdateTask();

  const myTasks = tasks?.filter(t => t.assigneeId === user?.id) || [];
  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const handleComplete = (taskId: number) => {
    updateTask({ id: taskId, status: 'completed' });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">جاري تحميل البيانات...</div>;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="bg-gradient-to-l from-primary/10 via-background to-background border-none shadow-lg">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
              {user?.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-right space-y-2 flex-1">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
              موظف
            </Badge>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground max-w-xl text-lg">{user?.bio || "لا يوجد نبذة تعريفية"}</p>
            <div className="flex items-center justify-center md:justify-start gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{pendingTasks.length} مهام قيد الانتظار</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{completedTasks.length} مهام مكتملة</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          مهامي
        </h2>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-muted/50 w-full md:w-auto">
            <TabsTrigger value="pending" className="flex-1 md:flex-none min-w-[120px]">
              قيد التنفيذ ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 md:flex-none min-w-[120px]">
              المكتملة ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingTasks.length === 0 ? (
              <EmptyState message="لا توجد مهام جديدة، عمل رائع!" />
            ) : (
              pendingTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onComplete={() => handleComplete(task.id)} 
                  isPending={isPending}
                  actionable
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6 space-y-4">
            {completedTasks.length === 0 ? (
              <EmptyState message="لم تكمل أي مهام بعد" />
            ) : (
              completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TaskCard({ task, onComplete, isPending, actionable }: { task: any, onComplete?: () => void, isPending?: boolean, actionable?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className={`overflow-hidden transition-all hover:shadow-md border-l-4 ${task.status === 'completed' ? 'border-l-green-500 opacity-75' : 'border-l-orange-500'}`}>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className={`font-bold text-xl ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h3>
              {task.status === 'pending' && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                  عاجل
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">{task.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <CalendarIcon className="w-4 h-4" />
              <span>تاريخ التسليم: {format(new Date(task.dueDate), "d MMMM yyyy", { locale: ar })}</span>
            </div>
          </div>

          {actionable && (
            <Button 
              onClick={onComplete} 
              disabled={isPending}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
            >
              {isPending ? "جاري التحديث..." : (
                <>
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                  تمييز كمكتملة
                </>
              )}
            </Button>
          )}
          
          {!actionable && task.status === 'completed' && (
             <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-4 py-1.5 text-sm">
               <CheckCircle2 className="ml-2 h-3 w-3" />
               تم الإنجاز
             </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center border-2 border-dashed rounded-xl border-muted bg-muted/10">
      <CheckCircle2 className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
      <p className="text-xl font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
