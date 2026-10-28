# HSN – HENG SAMNANG ROOM RENTAL MANAGEMENT SYSTEM
## ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល (Room Rental Management System)

---

Tài liệu này hướng dẫn chi tiết từng bước để xuất và đưa toàn bộ ứng dụng **HSN Room Rental Management System** lên Web Hosting / VPS / Cloud Server phục vụ sử dụng thực tế trên tên miền riêng (`https://domain-cua-toi.com`).

---

## 1. TỔNG QUAN KIẾN TRÚC & DỮ LIỆU CỦA ỨNG DỤNG

- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Lucide Icons + Motion + Recharts + HTML-to-Image.
- **Loại ứng dụng**: **Client-Side Single Page Application (SPA)** sản xuất chuẩn cao cấp, tự động tối ưu hóa tài nguyên tĩnh (HTML/CSS/JS/Fonts/SVG).
- **Cơ chế lưu trữ & Cơ sở dữ liệu (Database)**:
  - Dữ liệu phòng (`savedTenants`), lịch sử đóng tiền (`invoice_history`), bản nháp hóa đơn (`invoice_draft`), và dữ liệu thống kê tháng (`custom_monthly_data`) được khởi tạo sẵn với bộ dữ liệu chuẩn (`initialSavedTenants`, `initialHistory`) và được lưu trữ bền vững, tự động đồng bộ trên trình duyệt qua **Browser LocalStorage**.
  - Trạng thái đăng nhập bảo mật được quản lý thông qua **Session Storage**.
  - Xuất hóa đơn chất lượng cao 4K dạng file PNG không phụ thuộc vào server trung gian, xử lý trực tiếp trên client (100% offline & real-time).
- **Tính tương thích**: Hoạt động hoàn hảo trên mọi thiết bị: Desktop (Chrome, Edge, Firefox, Safari), Mobile (iOS Safari, Android Chrome) và Tablet.

---

## 2. HƯỚNG DẪN TRIỂN KHAI TỪNG BƯỚC (BƯỚC 1 ĐẾN BƯỚC 14)

### BƯỚC 1: Download mã nguồn từ Google AI Studio
1. Nhấp vào nút **Export** / **Download ZIP** trên giao diện Google AI Studio hoặc tải trực tiếp file `hsn-room-rental-production.zip`.
2. Lưu file nén về máy tính của bạn.

### BƯỚC 2: Giải nén project
1. Giải nén file ZIP vào một thư mục làm việc, ví dụ: `hsn-room-rental-production`.
2. Cấu trúc thư mục chuẩn:
   ```text
   hsn-room-rental-production/
   ├── dist/                 # Thư mục build sẵn sàng đưa lên Web Hosting
   │   ├── index.html
   │   └── assets/
   ├── src/                  # Mã nguồn React + TypeScript
   │   ├── App.tsx
   │   ├── index.css
   │   └── main.tsx
   ├── public/               # Static assets
   ├── index.html            # Entry HTML
   ├── package.json          # Dependencies & scripts
   ├── vite.config.ts        # Cấu hình Vite
   ├── tsconfig.json         # Cấu hình TypeScript
   ├── Dockerfile            # Cấu hình container Docker
   ├── nginx.conf            # Cấu hình Nginx với SPA routing & Gzip
   ├── .env.example          # Mẫu biến môi trường
   └── README.md             # Hướng dẫn này
   ```

### BƯỚC 3: Cài đặt Dependencies (nếu bạn muốn build lại từ mã nguồn)
Yêu cầu: Đã cài đặt **Node.js** (phiên bản 18 hoặc 20 trở lên).
```bash
npm install
```

### BƯỚC 4: Cấu hình Environment Variables (Biến môi trường)
1. Sao chép `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
2. Điền tên miền production của bạn:
   ```env
   PORT=3000
   VITE_APP_URL="https://domain-cua-toi.com"
   ```

### BƯỚC 5: Kiểm tra kết nối dữ liệu
- Không cần cấu hình server SQL phức tạp vì toàn bộ dữ liệu ban đầu đã được nhúng sẵn nguyên vẹn trong mã nguồn và tự động nạp vào bộ nhớ LocalStorage của người dùng ngay lần đầu mở ứng dụng.
- Người dùng có thể thêm, sửa, xóa, đánh dấu thanh toán (Mark Paid), thay đổi số điện/nước, tải hóa đơn 4K hoàn toàn trực tiếp.

### BƯỚC 6: Build Production
Chạy lệnh tạo gói tối ưu hóa cho môi trường web:
```bash
npm run build
```
Kết quả sẽ nằm gọn trong thư mục `dist/`. Thư mục này chứa toàn bộ HTML, CSS và JavaScript nén siêu nhẹ, sẵn sàng đưa lên bất kỳ Web Hosting nào.

---

### BƯỚC 7: Deploy lên Web Hosting (Chọn 1 trong các phương án dưới đây)

#### PHƯƠNG ÁN A: Shared Hosting / cPanel (Phổ biến nhất, đơn giản nhất)
1. Đăng nhập vào cPanel / DirectAdmin của gói Hosting.
2. Mở mục **File Manager** (Quản lý tệp tin) -> vào thư mục `public_html` (hoặc thư mục gốc của sub-domain).
3. Tải toàn bộ các file bên trong thư mục `dist/` (bao gồm `index.html` và thư mục `assets/`) lên `public_html`.
4. Tạo thêm file `.htaccess` trong `public_html` để hỗ trợ SPA Routing:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

#### PHƯƠNG ÁN B: Static Web Hosting (Vercel / Netlify / Cloudflare Pages) - Miễn phí & Cực nhanh
- **Vercel**:
  1. Đăng nhập [vercel.com](https://vercel.com).
  2. Tạo New Project -> Kéo thả thư mục `dist` hoặc liên kết repository Git.
  3. Build Command: `npm run build`, Output Directory: `dist`.
  4. Nhấn **Deploy**.
- **Netlify**:
  1. Kéo thả thư mục `dist` trực tiếp vào trang quản trị Netlify Drop.
  2. Tạo file `dist/_redirects` với nội dung: `/*    /index.html   200`.

#### PHƯƠNG ÁN C: VPS Linux (Ubuntu / Debian + Nginx)
1. Cài đặt Nginx:
   ```bash
   sudo apt update && sudo apt install -y nginx
   ```
2. Sao chép nội dung thư mục `dist/` vào `/var/www/hsn-room-rental`.
3. Cấu hình file Nginx `/etc/nginx/sites-available/hsn`:
   ```nginx
   server {
       listen 80;
       server_name domain-cua-toi.com www.domain-cua-toi.com;
       root /var/www/hsn-room-rental;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```
4. Kích hoạt và khởi động lại Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/hsn /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

#### PHƯƠNG ÁN D: Chạy bằng Docker / Google Cloud Run / AWS ECS
Project đã có sẵn `Dockerfile` và `nginx.conf`:
```bash
# Build Docker image
docker build -t hsn-room-rental:latest .

# Run container tại cổng 80 hoặc 3000
docker run -d -p 80:80 --name hsn-app hsn-room-rental:latest
```

---

### BƯỚC 8: Cấu hình Domain (Tên miền riêng)
1. Đăng nhập trang quản lý nhà cung cấp tên miền (Namecheap, GoDaddy, Cloudflare, PA Việt Nam, Mắt Bão,...).
2. Vào phần **DNS Management** (Quản lý bản ghi DNS).
3. Thêm các bản ghi trỏ về IP của Hosting / VPS:
   - **Bản ghi A**: Host `@` trỏ đến `IP_HOSTING_CỦA_BẠN` (ví dụ: `123.45.67.89`).
   - **Bản ghi CNAME**: Host `www` trỏ đến `domain-cua-toi.com`.

### BƯỚC 9: Cấu hình HTTPS / SSL
- **Nếu dùng Cloudflare**: Bật đám mây màu cam (Proxied) và chọn chế độ SSL/TLS là **Full** hoặc **Flexible**.
- **Nếu dùng cPanel**: Bật tính năng **AutoSSL** (Let's Encrypt / cPanel SSL) miễn phí trong cPanel.
- **Nếu dùng Nginx trên VPS**: Chạy Certbot để cấp chứng chỉ tự động:
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d domain-cua-toi.com -d www.domain-cua-toi.com
  ```

---

### BƯỚC 10: Kiểm tra Đăng nhập (Login)
1. Truy cập `https://domain-cua-toi.com`.
2. Màn hình đăng nhập hiển thị: Logo HSN, Heng Samnang, Khmer & English, nút đăng nhập.
3. Nhập tài khoản quản trị để tiến vào hệ thống.

### BƯỚC 11: Kiểm tra Dữ liệu Phòng (Rooms)
- Danh sách tất cả các phòng (Room Directory) hiển thị đầy đủ bên góc phải.
- Thông tin phòng, giá thuê, cọc, wifi, số điện/nước hiển thị chính xác.

### BƯỚC 12: Kiểm tra Dữ liệu Khách Thuê (Tenants)
- Tab 2 "ភ្ញៀវស្នាក់នៅ (Tenants)" quản lý đầy đủ khách thuê.
- Nút bấm thêm, sửa, xóa, tìm kiếm hoạt động trơn tru.

### BƯỚC 13: Kiểm tra Hóa đơn & Xuất 4K PNG (Invoices)
- Tab 1 "វិក្កយបត្រ (Invoice)" hiển thị đầy đủ chi tiết hóa đơn.
- Bấm nút **ទាញយក (Download)**: File ảnh 4K PNG độ nét cao tự động xuất về máy tính/điện thoại.
- Tab 5 "ពិនិត្យផលបូកសរុបរបស់ភ្ញៀវ (Total Summary Checker)" hiển thị bảng 12 tháng tách riêng 2 cột tiền Điện & Nước và xuất hóa đơn tổng hợp 4K hoàn chỉnh.

### BƯỚC 14: Kiểm tra trên Điện thoại & Máy tính bảng
- Mở `https://domain-cua-toi.com` trên iPhone (Safari) và Android (Chrome).
- Giao diện tự động căn chỉnh responsive theo từng kích thước màn hình, các nút bấm có kích thước chuẩn touch target, hiệu ứng âm thanh click nhẹ nhàng.

---

## 3. CHECKLIST KIỂM TRA TOÀN DIỆN SAU KHI DEPLOY

- [x] Không còn đường dẫn `localhost` hoặc `127.0.0.1` trong mã nguồn.
- [x] Giao diện, màu sắc nền xanh lá cây đậm và hình nhà mờ mờ giữ nguyên 100%.
- [x] Màn hình đăng nhập HSN giữ nguyên 100%.
- [x] Toàn bộ dữ liệu khách thuê, giá phòng, điện nước giữ nguyên vẹn.
- [x] Chức năng tải hóa đơn 4K PNG hoạt động trên mọi tab.
- [x] Cột tiền điện và tiền nước được phân tách rõ ràng, minh bạch.
- [x] Responsive mượt mà trên Desktop, Tablet và Điện thoại di động.
- [x] Bảo mật: Không để lộ API key hay thông tin nhạy cảm.
- [x] Đã cấu hình SPA fallback để không bị lỗi 404 khi người dùng F5 / reload trang.
