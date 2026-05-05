import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ChildAttendancePanel from '@/components/profile/ChildAttendancePanel';
import TalkToSchoolPanel from '@/components/profile/TalkToSchoolPanel';

const StudentAttendancePage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'talk' ? 'talk' : 'attendance';

  useEffect(() => {
    if (!user) navigate('/auth/login');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
              <TabsList>
                <TabsTrigger value="attendance">
                  {language === 'id' ? 'Kehadiran' : 'Attendance'}
                </TabsTrigger>
                <TabsTrigger value="talk">
                  {language === 'id' ? 'Bicara dengan Sekolah' : 'Talk To School'}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="attendance" className="mt-6">
                <ChildAttendancePanel />
              </TabsContent>
              <TabsContent value="talk" className="mt-6">
                <TalkToSchoolPanel />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendancePage;