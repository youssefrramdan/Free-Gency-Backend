# 💬 دليل نظام الشات المطور - Free Gency

## 🎯 نظرة عامة على النظام

نظام شات متطور مرتبط بالمهام والفرق، يدعم:

- **REST API** للعمليات الأساسية
- **Socket.IO** للرسائل الفورية
- **نظام صلاحيات ديناميكي** مرتبط بـ Subtasks
- **تحديث تلقائي** للصلاحيات عند إضافة/حذف المهام الفرعية

---

## 🔐 نظام الصلاحيات الذكي

### المراحل:

1. **بداية المشروع** (عند قبول الفريق):

   - الكلايت + التيم ليدر بس يقدروا يشوفوا الشات

2. **إضافة Subtasks** (ديناميكي):

   - التيم ليدر يعمل subtasks من المهمة الأصلية
   - كل subtask يتم assign لعضو محدد
   - **العضو اللي اتعمله assign يتضاف للشات تلقائياً**

3. **التحديث التلقائي**:
   - تعديل assignment → تحديث الشات
   - حذف subtask → إزالة العضو من الشات
   - إضافة subtask جديد → إضافة العضو الجديد

---

## 🛠 REST API Endpoints

### 1. جلب شاتات المستخدم

```http
GET /api/v1/chat/my-chats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "projectId": "task_id_here",
      "projectTitle": "تطوير موقع إلكتروني",
      "lastMessage": {
        "text": "تم الانتهاء من التصميم",
        "senderName": "أحمد محمد",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "participants": [
        {
          "id": "user_id",
          "role": "client"
        }
      ]
    }
  ]
}
```

### 2. جلب رسائل المشروع

```http
GET /api/v1/chat/project/:projectId/messages?page=1&limit=50
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id": "msg_id",
        "text": "مرحباً، متى سيتم البدء؟",
        "senderId": "user_id",
        "senderName": "سارة أحمد",
        "senderImage": "profile.jpg",
        "senderRole": "client",
        "timestamp": "2024-01-15T10:30:00Z",
        "type": "text"
      }
    ],
    "pagination": {
      "page": 1,
      "pages": 3,
      "total": 150
    }
  }
}
```

### 3. إرسال رسالة

```http
POST /api/v1/chat/project/:projectId/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "سيتم البدء غداً إن شاء الله",
  "type": "text"
}
```

### 4. فحص صلاحية الوصول

```http
GET /api/v1/chat/project/:projectId/access
Authorization: Bearer <token>
```

---

## 🔄 Socket.IO Events

### الاتصال والمصادقة:

```javascript
const socket = io('ws://localhost:5000', {
  auth: {
    token: 'your_jwt_token_here',
  },
});
```

### الأحداث المتاحة:

#### 1. الانضمام للمشروع

```javascript
socket.emit('join_project', { projectId: 'task_id_here' });
```

#### 2. إرسال رسالة فورية

```javascript
socket.emit('send_message', {
  projectId: 'task_id_here',
  text: 'مرحباً بالجميع',
  type: 'text',
});
```

#### 3. مؤشرات الكتابة

```javascript
// بداية الكتابة
socket.emit('typing_start', { projectId: 'task_id_here' });

// انتهاء الكتابة
socket.emit('typing_stop', { projectId: 'task_id_here' });
```

#### 4. الاستماع للأحداث

```javascript
// رسالة جديدة
socket.on('new_message', data => {
  console.log('رسالة جديدة:', data);
});

// مؤشر الكتابة
socket.on('user_typing', data => {
  console.log(`${data.userName} يكتب...`);
});

socket.on('user_stopped_typing', data => {
  console.log(`${data.userName} توقف عن الكتابة`);
});
```

---

## 📱 مثال Flutter Service Class

```dart
class ChatService {
  static const String baseUrl = 'http://your-api-url/api/v1';
  late IO.Socket socket;

  // ===== REST API Methods =====

  Future<List<ChatRoom>> getMyChats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/chat/my-chats'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((chat) => ChatRoom.fromJson(chat))
          .toList();
    }
    throw Exception('فشل في جلب الشاتات');
  }

  Future<ChatMessagesResponse> getProjectMessages(String projectId, {int page = 1}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/chat/project/$projectId/messages?page=$page'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return ChatMessagesResponse.fromJson(data['data']);
    }
    throw Exception('فشل في جلب الرسائل');
  }

  Future<bool> sendMessage(String projectId, String text) async {
    final response = await http.post(
      Uri.parse('$baseUrl/chat/project/$projectId/send'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'text': text, 'type': 'text'}),
    );

    return response.statusCode == 201;
  }

  Future<bool> checkChatAccess(String projectId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/chat/project/$projectId/access'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['hasAccess'] ?? false;
    }
    return false;
  }

  // ===== Socket.IO Methods =====

  void initializeSocket(String token) {
    socket = IO.io('ws://your-socket-url:5000',
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .build()
    );

    socket.connect();

    // الاستماع للأحداث
    socket.on('new_message', (data) {
      _handleNewMessage(ChatMessage.fromJson(data));
    });

    socket.on('user_typing', (data) {
      _handleUserTyping(data['userId'], data['userName'], true);
    });

    socket.on('user_stopped_typing', (data) {
      _handleUserTyping(data['userId'], data['userName'], false);
    });
  }

  void joinProject(String projectId) {
    socket.emit('join_project', {'projectId': projectId});
  }

  void leaveProject(String projectId) {
    socket.emit('leave_project', {'projectId': projectId});
  }

  void sendSocketMessage(String projectId, String text) {
    socket.emit('send_message', {
      'projectId': projectId,
      'text': text,
      'type': 'text'
    });
  }

  void startTyping(String projectId) {
    socket.emit('typing_start', {'projectId': projectId});
  }

  void stopTyping(String projectId) {
    socket.emit('typing_stop', {'projectId': projectId});
  }

  void _handleNewMessage(ChatMessage message) {
    // تحديث UI
    notifyListeners();
  }

  void _handleUserTyping(String userId, String userName, bool isTyping) {
    // إظهار/إخفاء مؤشر الكتابة
  }

  void dispose() {
    socket.disconnect();
  }
}
```

---

## 📦 نماذج البيانات المطلوبة

### ChatRoom Model:

```dart
class ChatRoom {
  final String projectId;
  final String projectTitle;
  final ChatMessage? lastMessage;
  final List<ChatParticipant> participants;

  ChatRoom({
    required this.projectId,
    required this.projectTitle,
    this.lastMessage,
    required this.participants,
  });

  factory ChatRoom.fromJson(Map<String, dynamic> json) {
    return ChatRoom(
      projectId: json['projectId'],
      projectTitle: json['projectTitle'],
      lastMessage: json['lastMessage'] != null
          ? ChatMessage.fromJson(json['lastMessage'])
          : null,
      participants: (json['participants'] as List)
          .map((p) => ChatParticipant.fromJson(p))
          .toList(),
    );
  }
}
```

### ChatMessage Model:

```dart
class ChatMessage {
  final String id;
  final String text;
  final String senderId;
  final String senderName;
  final String? senderImage;
  final String senderRole;
  final DateTime timestamp;
  final String type;
  final String? fileUrl;
  final String? fileName;

  ChatMessage({
    required this.id,
    required this.text,
    required this.senderId,
    required this.senderName,
    this.senderImage,
    required this.senderRole,
    required this.timestamp,
    required this.type,
    this.fileUrl,
    this.fileName,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      text: json['text'],
      senderId: json['senderId'],
      senderName: json['senderName'],
      senderImage: json['senderImage'],
      senderRole: json['senderRole'],
      timestamp: DateTime.parse(json['timestamp']),
      type: json['type'],
      fileUrl: json['fileUrl'],
      fileName: json['fileName'],
    );
  }
}
```

---

## 🚀 التدفق النهائي للتطبيق

### 1. في صفحة الشاتات:

```dart
// جلب قائمة الشاتات
final chats = await ChatService().getMyChats();
```

### 2. عند دخول شات معين:

```dart
// فحص الصلاحية أولاً
final hasAccess = await ChatService().checkChatAccess(projectId);
if (!hasAccess) {
  // إظهار رسالة عدم وجود صلاحية
  return;
}

// الانضمام للشات
ChatService().joinProject(projectId);

// جلب الرسائل
final messages = await ChatService().getProjectMessages(projectId);
```

### 3. عند إرسال رسالة:

```dart
// عبر Socket.IO للسرعة
ChatService().sendSocketMessage(projectId, messageText);

// أو عبر REST API
await ChatService().sendMessage(projectId, messageText);
```

### 4. عند الكتابة:

```dart
// بداية الكتابة
ChatService().startTyping(projectId);

// بعد 3 ثوان من عدم الكتابة
ChatService().stopTyping(projectId);
```

---

## 🎯 المميزات الرئيسية

✅ **نظام صلاحيات ذكي** - مرتبط بـ Subtasks
✅ **تحديث تلقائي** - إضافة/إزالة الأعضاء ديناميكياً
✅ **رسائل فورية** - Socket.IO للاستجابة السريعة
✅ **مؤشرات الكتابة** - تجربة مستخدم محسنة
✅ **REST API شامل** - للعمليات الأساسية
✅ **أمان عالي** - مصادقة JWT في كل طلب

---

## 🔧 ملاحظات مهمة

1. **تأكد من تشغيل Socket.IO** على نفس port الـ server
2. **استخدم JWT صحيح** في كل طلب
3. **تعامل مع الأخطاء** بشكل مناسب
4. **اختبر النظام** مع multiple users
5. **الشاتات تتحدث تلقائياً** مع الـ Subtasks

---

**النظام جاهز للاستخدام! 🎉**
