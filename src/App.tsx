import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobListing from './pages/JobListing';
import JobDetails from './pages/JobDetails';
import PostDetails from './pages/PostDetails';
import PostJob from './pages/PostJob';
import Inbox from './pages/Inbox';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import GroupDetail from "./pages/GroupDetail";
import Saved from "./pages/Saved";
import AppliedJobs from "./pages/AppliedJobs";
import Applicants from "./pages/Applicants";
import Search from "./pages/Search";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Job listing routes — all handled by JobListing via pathname */}
        <Route path="/jobs" element={<JobListing />} />
        <Route path="/jobs/urgent" element={<JobListing />} />
        <Route path="/jobs/full-time" element={<JobListing />} />
        <Route path="/jobs/part-time" element={<JobListing />} />
        <Route path="/jobs/remote" element={<JobListing />} />
        {/* Job & Post detail routes */}
        <Route path="/jobs/id/:id" element={<JobDetails />} />
        <Route path="/post/:id" element={<PostDetails />} />
        {/* Other pages */}
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/messages" element={<Inbox />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/applied-jobs" element={<AppliedJobs />} />
        <Route path="/applicants" element={<Applicants />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </Layout>
  );
}

export default App;
