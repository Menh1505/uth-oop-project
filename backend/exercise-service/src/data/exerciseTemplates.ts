export type ExerciseTemplate = {
  template_id: string;
  exercise_name: string;
  description: string;
  muscle_group: string;
  intensity: 'Low' | 'Medium' | 'High';
  exercise_type: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  default_duration: number;
  default_calories: number;
  instructions: string[];
};

export const exerciseTemplates: ExerciseTemplate[] = [
  {
    template_id: 'tpl-cardio-30',
    exercise_name: 'Chạy bộ 30 phút',
    description: 'Chạy bộ tốc độ vừa phải để đốt mỡ và cải thiện tim mạch',
    muscle_group: 'Toàn thân',
    intensity: 'Medium',
    exercise_type: 'Cardio',
    default_duration: 30,
    default_calories: 260,
    instructions: [
      'Khởi động kỹ 5 phút',
      'Chạy tốc độ trung bình 20 phút',
      'Thả lỏng nhẹ 5 phút'
    ]
  },
  {
    template_id: 'tpl-hiit-15',
    exercise_name: 'HIIT 15 phút',
    description: '4 hiệp HIIT 40s hoạt động + 20s nghỉ',
    muscle_group: 'Tim mạch + Core',
    intensity: 'High',
    exercise_type: 'Cardio',
    default_duration: 15,
    default_calories: 200,
    instructions: [
      'Khởi động động 3 phút',
      '4 hiệp: 40s max effort + 20s nghỉ',
      'Hạ nhiệt và giãn cơ 2 phút'
    ]
  },
  {
    template_id: 'tpl-strength-fullbody',
    exercise_name: 'Full-body strength',
    description: '5 bài tập sức mạnh cơ bản với tạ nhẹ',
    muscle_group: 'Ngực / Vai / Chân / Lưng',
    intensity: 'Medium',
    exercise_type: 'Strength',
    default_duration: 35,
    default_calories: 220,
    instructions: [
      'Hít đất 3 hiệp x 12 lần',
      'Goblet squat 3 hiệp x 12',
      'Bent-over row 3 hiệp x 12',
      'Shoulder press 3 hiệp x 10',
      'Plank 3 hiệp x 45s'
    ]
  },
  {
    template_id: 'tpl-yoga-relax',
    exercise_name: 'Yoga thư giãn',
    description: 'Chuỗi yoga cơ bản giúp thư giãn cơ bắp và giảm stress',
    muscle_group: 'Lưng / Hông / Core',
    intensity: 'Low',
    exercise_type: 'Flexibility',
    default_duration: 25,
    default_calories: 90,
    instructions: [
      'Sun salutation A & B (4 vòng)',
      'Warrior flow 2 hiệp mỗi bên',
      'Hold pigeon pose 1 phút mỗi bên',
      'Hít thở sâu + thiền 3 phút'
    ]
  },
  {
    template_id: 'tpl-core-focus',
    exercise_name: 'Core & Abs',
    description: 'Tập trung siết cơ bụng và core trong 20 phút',
    muscle_group: 'Core',
    intensity: 'Medium',
    exercise_type: 'Strength',
    default_duration: 20,
    default_calories: 150,
    instructions: [
      'Mountain climber 3x30s',
      'Russian twist 3x20',
      'Leg raise 3x15',
      'Side plank 2x40s mỗi bên',
      'Dead bug 3x12'
    ]
  }
];
