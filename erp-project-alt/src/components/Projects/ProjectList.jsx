import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProjectList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
const fetchProjects = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token
      },
    });

    const data = await response.json();

    if (response.ok) {
      setProjects(data.data);
    } else {
      throw new Error(data.message || 'Failed to fetch projects');
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  if (loading) return <div className="text-center py-8">Loading projects...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className={`${selectedProject ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Client Projects</h2>
            {user.role === 'admin' && (
              <Link
                to="/projects/new"
                className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary"
              >
                New Project
              </Link>
            )}
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedProject?.id === project.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {project.client}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
                  <p className="text-xs text-gray-400">Created: {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No projects found</p>
            )}
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">Client: {selectedProject.client}</p>
                <p className="text-xs text-gray-400">Created: {new Date(selectedProject.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>{selectedProject.description}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Project Documents</h3>
                <Link
                  to={`/projects/${selectedProject.id}/upload`}
                  className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary"
                >
                  Upload Document
                </Link>
              </div>
              
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedProject.documents && selectedProject.documents.length > 0 ? (
                      selectedProject.documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a
                              href={`http://localhost:7000/${doc.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary mr-3"
                            >
                              View
                            </a>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No documents uploaded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate(`/projects/${selectedProject.id}`)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
              >
                View Project Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;