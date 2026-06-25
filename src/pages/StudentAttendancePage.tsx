import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import ChildAttendancePanel from '@/components/profile/ChildAttendancePanel';
import TalkToSchoolPanel from '@/components/profile/TalkToSchoolPanel';
import DocumentPanel from '@/components/profile/DocumentPanel';
import ParentingGuidancePanel from '@/components/profile/ParentingGuidancePanel';
import { useCanAccessStudent } from '@/hooks/useCanAccessStudent';

const StudentAttendancePage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [canAccessPortal, setCanAccessPortal] = useState(false);
  const { canAccess: canAccessStudent, loading: studentAccessLoading } = useCanAccessStudent();

  const validTabs = ['attendance', 'talk', 'documents', 'guidance'];
  const requestedTab = params.get('tab') || 'attendance';
  const tab = validTabs.includes(requestedTab) ? requestedTab : 'attendance';

  useEffect(() => {
    if (!user) navigate('/auth/login');
  }, [user, navigate]);

  // Block users who are not admins or verified buyers from the Student area
  useEffect(() => {
    if (user && !studentAccessLoading && !canAccessStudent) {
      navigate('/');
    }
  }, [user, studentAccessLoading, canAccessStudent, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('can_access_parent_portal');
      if (!cancelled) setCanAccessPortal(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;
  if (studentAccessLoading || !canAccessStudent) return null;

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="attendance">
                  {language === 'id' ? 'Kehadiran' : 'Attendance'}
                </TabsTrigger>
                <TabsTrigger value="talk">
                  {language === 'id' ? 'Bicara dengan Sekolah' : 'Talk To School'}
                </TabsTrigger>
                {canAccessPortal && (
                  <>
                    <TabsTrigger value="documents">
                      {language === 'id' ? 'Dokumen' : 'Documents'}
                    </TabsTrigger>
                    <TabsTrigger value="guidance">
                      {language === 'id' ? 'Panduan Parenting' : 'Parenting Guidance'}
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
              <TabsContent value="attendance" className="mt-6">
                <ChildAttendancePanel />
              </TabsContent>
              <TabsContent value="talk" className="mt-6">
                <TalkToSchoolPanel />
              </TabsContent>
              {canAccessPortal && (
                <>
                  <TabsContent value="documents" className="mt-6">
                    <DocumentPanel />
                  </TabsContent>
                  <TabsContent value="guidance" className="mt-6">
                    <ParentingGuidancePanel />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendancePage;