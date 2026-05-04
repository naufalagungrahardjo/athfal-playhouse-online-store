import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ChildAttendancePanel from '@/components/profile/ChildAttendancePanel';

const StudentAttendancePage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth/login');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'id' ? 'Kehadiran Anak' : 'Child Attendance'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChildAttendancePanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendancePage;