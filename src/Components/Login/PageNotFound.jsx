import { Button, Card } from 'antd';
import { HomeOutlined, PlayCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 selection:bg-primary selection:text-white">
      {/* Background Soft Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-8 text-center relative z-10" variant="borderless">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
          <PlayCircleFilled className="text-white text-3xl" />
        </div>

        <h1 className="text-6xl sm:text-7xl font-black text-primary mb-2 tracking-tight">
          404
        </h1>
        <h2 className="text-2xl font-extrabold text-darkPurple mb-2">Page Not Found</h2>
        <p className="text-sm text-text mb-6 max-w-sm mx-auto leading-relaxed">
          The requested page could not be found or has been moved to another live stream room.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="primary"
            icon={<HomeOutlined />}
            size="large"
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl h-11 px-6 shadow-md shadow-primary/30"
          >
            Go Home
          </Button>
          <Button
            icon={<PlayCircleFilled className="text-primary" />}
            size="large"
            onClick={() => navigate('/livestreamingplatform')}
            className="border border-border text-darkPurple hover:border-primary hover:text-primary font-bold rounded-xl h-11 px-6"
          >
            Browse Streams
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PageNotFound;
