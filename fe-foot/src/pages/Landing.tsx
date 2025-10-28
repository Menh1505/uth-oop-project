import { Link } from "react-router-dom";

export default function Landing() {
  console.log('Landing component rendered');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            FitFood
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-800">
              Đăng nhập
            </Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Chào mừng đến với FitFood
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Ứng dụng theo dõi dinh dưỡng và tập luyện giúp bạn đạt mục tiêu sức khỏe.
          Ghi nhật ký bữa ăn, theo dõi bài tập, và nhận gợi ý AI cá nhân hóa.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
            Bắt đầu ngay
          </Link>
          <Link to="/login" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50">
            Đăng nhập
          </Link>
        </div>
      </main>
    </div>
  );
}
