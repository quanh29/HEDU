# API Languages & Levels

## Endpoints mới để fetch dữ liệu động

### 1. GET Languages
**Endpoint:** `GET /api/languages`

**Description:** Lấy danh sách tất cả ngôn ngữ từ bảng Languages

**Response:**
```json
[
  {
    "lang_id": "fb9f58be-aaa8-11f0-8462-581122e62853",
    "title": "vietnamese"
  },
  {
    "lang_id": "fb9f5b2e-aaa8-11f0-8462-581122e62853",
    "title": "english"
  }
]
```

**Usage trong frontend:**
```javascript
// Fetch languages
const response = await axios.get(`${VITE_BASE_URL}/api/languages`);
setLanguages(response.data);

// Map từ title sang lang_id khi save
const selectedLanguage = languages.find(
  lang => lang.title.toLowerCase() === courseData.language.toLowerCase()
);
const lang_id = selectedLanguage ? selectedLanguage.lang_id : languages[0]?.lang_id;
```

### 2. GET Levels
**Endpoint:** `GET /api/levels`

**Description:** Lấy danh sách tất cả levels từ bảng Levels

**Response:**
```json
[
  {
    "lv_id": "L1",
    "title": "beginner"
  },
  {
    "lv_id": "L2",
    "title": "intermediate"
  },
  {
    "lv_id": "L3",
    "title": "advanced"
  }
]
```

**Usage trong frontend:**
```javascript
// Fetch levels
const response = await axios.get(`${VITE_BASE_URL}/api/levels`);
setLevels(response.data);

// Map từ title sang lv_id khi save
const selectedLevel = levels.find(
  lv => lv.title.toLowerCase() === courseData.level.toLowerCase()
);
const lv_id = selectedLevel ? selectedLevel.lv_id : 'L1';
```

## Implementation

### Backend Files Created/Updated

#### 1. `backend/controllers/languageController.js` (NEW)
```javascript
import pool from '../config/mysql.js';

export const getLanguages = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lang_id, title FROM Languages ORDER BY title');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

#### 2. `backend/routes/languageRoute.js` (NEW)
```javascript
import express from 'express';
import { getLanguages } from '../controllers/languageController.js';

const languageRouter = express.Router();
languageRouter.get('/', getLanguages);

export default languageRouter;
```

#### 3. `backend/server.js` (UPDATED)
```javascript
// Import
import languageRouter from './routes/languageRoute.js';

// Route
app.use("/api/languages", languageRouter);
```

### Frontend Integration

#### CourseManagement.jsx Changes

**1. State Management:**
```javascript
// Add new state
const [levels, setLevels] = useState([]);
const [languages, setLanguages] = useState([]);
```

**2. Fetch on Mount:**
```javascript
useEffect(() => {
  fetchHeadingsAndCategories();
  fetchLevelsAndLanguages();
}, []);

const fetchLevelsAndLanguages = async () => {
  try {
    const [levelsRes, languagesRes] = await Promise.all([
      axios.get(`${import.meta.env.VITE_BASE_URL}/api/levels`),
      axios.get(`${import.meta.env.VITE_BASE_URL}/api/languages`)
    ]);
    
    setLevels(levelsRes.data);
    setLanguages(languagesRes.data);
  } catch (error) {
    console.error('Error fetching levels/languages:', error);
  }
};
```

**3. Update Save Logic:**
```javascript
const saveCourseWithStatus = async (status) => {
  // OLD: Hardcoded maps
  // const levelMap = { 'beginner': 'L1', ... };
  // const languageMap = { 'vietnamese': 'VN', ... };
  
  // NEW: Dynamic mapping from fetched data
  const selectedLevel = levels.find(
    lv => lv.title.toLowerCase() === courseData.level.toLowerCase()
  );
  const selectedLanguage = languages.find(
    lang => lang.title.toLowerCase() === courseData.language.toLowerCase()
  );
  
  const lv_id = selectedLevel ? selectedLevel.lv_id : 'L1';
  const lang_id = selectedLanguage ? selectedLanguage.lang_id : languages[0]?.lang_id;
  
  const payload = {
    ...
    lv_id: lv_id,
    lang_id: lang_id,
    ...
  };
};
```

## Benefits

✅ **Dynamic Data**: Không cần hardcode maps, dễ dàng thêm/sửa languages và levels trong database

✅ **Maintainability**: Thay đổi trong database tự động reflect lên frontend

✅ **Consistency**: Đảm bảo IDs luôn đúng với database

✅ **Scalability**: Dễ dàng mở rộng thêm languages/levels mới

## Testing

### Test Languages Endpoint
```bash
curl http://localhost:3000/api/languages
```

Expected response:
```json
[
  {
    "lang_id": "fb9f58be-aaa8-11f0-8462-581122e62853",
    "title": "vietnamese"
  },
  {
    "lang_id": "fb9f5b2e-aaa8-11f0-8462-581122e62853",
    "title": "english"
  }
]
```

### Test Levels Endpoint
```bash
curl http://localhost:3000/api/levels
```

Expected response:
```json
[
  {"lv_id": "L1", "title": "beginner"},
  {"lv_id": "L2", "title": "intermediate"},
  {"lv_id": "L3", "title": "advanced"}
]
```

### Frontend Testing
1. Mở browser console trong CourseManagement page
2. Kiểm tra logs:
   ```
   📊 [fetchLevelsAndLanguages] Levels: [...]
   🌍 [fetchLevelsAndLanguages] Languages: [...]
   ```
3. Khi save course, check logs:
   ```
   🗺️ [saveCourseWithStatus] Mapped IDs: {
     level: "beginner",
     lv_id: "L1",
     language: "vietnamese", 
     lang_id: "fb9f58be-aaa8-11f0-8462-581122e62853"
   }
   ```

## Notes

- **Fallback Values**: Nếu không tìm thấy matching level/language, sẽ fallback về L1 và first language
- **Case Insensitive**: Comparison dùng `.toLowerCase()` để tránh lỗi do case sensitivity
- **Order**: Languages sắp xếp theo title, Levels sắp xếp theo lv_id
- **Performance**: Dùng `Promise.all()` để fetch song song levels và languages
