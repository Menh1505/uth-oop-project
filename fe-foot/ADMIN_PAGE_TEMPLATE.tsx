// Template for API-Integrated Admin Page
// Copy and modify for other admin pages

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ApiClient } from '../../lib/api/client';

// Define your data interface
interface YourDataType {
  id: string;
  name: string;
  status?: string;
  // ... other fields
}

export default function YourAdminPage() {
  // State management
  const [data, setData] = useState<YourDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch function - customize endpoint
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await ApiClient.get<YourDataType[]>('/your-endpoint');
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ApiClient.post('/your-endpoint', formData);
      setFormData({ name: '' });
      setShowForm(false);
      await fetchData(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi thêm dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa?')) return;
    try {
      await ApiClient.delete(`/your-endpoint/${id}`);
      await fetchData(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa dữ liệu');
    }
  };

  // Render
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quản lý Dữ liệu</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Thêm mới
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Thêm mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Nhập tên"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : data.length === 0 ? (
          // Empty State
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Chưa có dữ liệu nào</p>
          </div>
        ) : (
          // Data Table
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tên</th>
                  <th className="px-6 py-3 text-left font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-left font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        {item.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700">
                        <Eye size={18} />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-700">
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/*
================================================================================
HOW TO USE THIS TEMPLATE:
================================================================================

1. CREATE NEW FILE
   cp this file to: fe-foot/src/pages/admin/YourPage.tsx

2. CUSTOMIZE INTERFACE
   Replace YourDataType with your actual data type

3. CUSTOMIZE ENDPOINT
   Replace '/your-endpoint' with actual API endpoint

4. UPDATE FORM FIELDS
   Modify form input fields in the {showForm && ...} section

5. UPDATE TABLE COLUMNS
   Add/remove table columns in the <table> section

6. ADD ROUTE
   Edit fe-foot/src/App.tsx and add:
   <Route path="/admin/your-page" element={<YourPage />} />

7. ADD SIDEBAR LINK
   Edit fe-foot/src/components/layout/AdminLayout.tsx
   Add link to new page

8. TEST IT
   Navigate to http://localhost:5173/admin/your-page

================================================================================
COMMON PATTERNS:
================================================================================

// Handle edit
const handleEdit = async (id: string) => {
  const item = data.find(d => d.id === id);
  setFormData(item);
  setShowForm(true);
};

// Handle update
const handleUpdate = async (id: string, updates: Partial<YourDataType>) => {
  try {
    await ApiClient.put(`/your-endpoint/${id}`, updates);
    await fetchData();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error');
  }
};

// With pagination
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);

const fetchData = async () => {
  const result = await ApiClient.get<YourDataType[]>(
    `/your-endpoint?page=${page}&pageSize=${pageSize}`
  );
  setData(result || []);
};

// With search
const [search, setSearch] = useState('');

const fetchData = async () => {
  const result = await ApiClient.get<YourDataType[]>(
    `/your-endpoint?search=${search}`
  );
  setData(result || []);
};

// With filters
const [statusFilter, setStatusFilter] = useState('all');

const filteredData = statusFilter === 'all' 
  ? data 
  : data.filter(d => d.status === statusFilter);

================================================================================
*/
