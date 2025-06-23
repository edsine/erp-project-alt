import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProjectDetail = () => {
const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`${BASE_URL}/projects/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setProject(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch project');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await fetch(`${BASE_URL}/projects/documents/${docId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh project data
          const updatedResponse = await fetch(`${BASE_URL}/projects/${id}`);
          const updatedData = await updatedResponse.json();
          setProject(updatedData.data);
        } else {
          throw new Error('Failed to delete document');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading project...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!project) return <div className="text-center py-8">Project not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-gray-500">Client: {project.client}</p>
          <p className="text-xs text-gray-400">
            Created: {new Date(project.created_at).toLocaleDateString()} | 
            Last updated: {new Date(project.updated_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Projects
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Project Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">
              {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="font-medium">
              {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not specified'}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-500">Description</p>
          <p className="whitespace-pre-line">{project.description || 'No description provided'}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Project Documents</h2>
          <Link
            to={`/projects/${project.id}/upload`}
            className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary"
          >
            Upload Document
          </Link>
        </div>

        {project.documents && project.documents.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{doc.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">User {doc.uploaded_by}</td>
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
                      {(user.role === 'admin' || user.id === doc.uploaded_by) && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
            No documents uploaded yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;