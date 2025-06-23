import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NewRequisition = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: '',
    items: [],
    attachments: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [name]: name === 'quantity' || name === 'unitPrice' ? Number(value) : value
    };
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unitPrice: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = [...formData.items];
      newItems.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => {
      const newAttachments = [...prev.attachments];
      newAttachments.splice(index, 1);
      return {
        ...prev,
        attachments: newAttachments
      };
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * (Number(item.unitPrice) || 0));
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title || !formData.description) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      setLoading(false);
      return;
    }

    if (formData.items.some(item => !item.name || !item.quantity || !item.unitPrice)) {
      setError('Please fill all item fields (name, quantity, and price)');
      setLoading(false);
      return;
    }

    if (!user) {
      setError('You must be logged in to create a requisition');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('created_by', user.id.toString());

      const firstItem = formData.items[0];
      formDataToSend.append('items', firstItem.name);
      formDataToSend.append('quantity', firstItem.quantity.toString());
      formDataToSend.append('unit_price', firstItem.unitPrice.toString());

      if (formData.attachments.length > 0) {
        formDataToSend.append('attachment', formData.attachments[0]);
      }

      const response = await fetch(`${BASE_URL}/requisitions`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create requisition');
      }

      const result = await response.json();
      window.alert(`Requisition created successfully! ID: ${result.requisitionId}`);
      navigate('/requisitions');
    } catch (err) {
      setError(err.message || 'Failed to create requisition');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Create New Requisition</h2>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Form goes here... */}
    </div>
  );
};

export default NewRequisition;
