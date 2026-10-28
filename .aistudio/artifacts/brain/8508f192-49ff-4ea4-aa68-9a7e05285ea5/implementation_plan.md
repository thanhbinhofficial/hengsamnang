# Nâng Cấp Hệ Thống Chia Sẻ Quyền Quản Lý & Bảng Điều Khiển Nguon Sopheak (HSN Rental Manager)

Nâng cấp trực tiếp hệ thống **HSN Rental Manager – HENG SAMNANG (HSN)** hiện có để bổ sung cơ chế **phân quyền Chủ sở hữu (Owner HSN) & Người quản lý (Manager – Nguon Sopheak)**, trang **Bảng điều khiển quản lý riêng cho Nguon Sopheak**, quy trình nhập khách mới & ghi chỉ số điện/nước hàng tháng tự động đồng bộ hai chiều với cơ sở dữ liệu gốc của HSN, cùng hệ thống **Nhật ký kiểm tra (Audit Log)** bất biến và sao lưu an toàn.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định đã được bạn xác nhận ở bước làm rõ yêu cầu, được tích hợp đầy đủ vào bản thiết kế nâng cấp mà không làm thay đổi hay mất bất kỳ dữ liệu hiện có nào của HSN:

- **Confirmed Decision 1 – Phạm vi phòng quản lý**: Tài khoản quản lý mặc định **Nguon Sopheak** được giao quản lý toàn bộ các phòng (`RM-01` đến `RM-17`), đồng thời Chủ sở hữu (HSN) có thể tùy chỉnh cấp/thu hồi từng phòng cụ thể bất kỳ lúc nào trong mục **ចែករំលែកសិទ្ធិ / Truy cập chia sẻ**.
- **Confirmed Decision 2 – Luồng màn hình sau đăng nhập**: Khi **Nguon Sopheak** đăng nhập bằng tài khoản riêng ở mục **Manager**, hệ thống tự động mở thẳng **Nguon Sopheak – Bảng điều khiển quản lý (ផ្ទាំងគ្រប់គ្រង ងួន សុភ័ក្រ)**, đồng thời vẫn có thể chuyển qua xem hóa đơn trong phạm vi quyền được cấp.
- **Confirmed Decision 3 – Cơ sở dữ liệu chung & Nhật ký kiểm tra (Audit Log)**: Sử dụng chung nguồn dữ liệu chính của ứng dụng HSN (liên kết chặt chẽ qua `Room ID`, `Tenant ID`, và `Utility Record ID`), tự động sao lưu trạng thái trước khi nâng cấp, kèm hệ thống **Audit Log** ghi nhận chi tiết người nhập, thời gian, giá trị trước/sau và trạng thái mạng/đồng bộ.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Mục Menu Quản Lý Chia Sẻ Mới (dành cho Chủ sở hữu HSN)**:
     - **អ្នកគ្រប់គ្រង / Người quản lý** (Manager Overview & Activity)
     - **បញ្ជីអ្នកគ្រប់គ្រង / Danh sách người quản lý** (Manager Accounts Directory – tạo sẵn tài khoản mặc định **Nguon Sopheak**, thêm/khóa/mở khóa/đổi mật khẩu băm bảo mật)
     - **ចែករំលែកសិទ្ធិ / Truy cập chia sẻ** (Shared Access & Room Permissions Matrix + Nhật ký kiểm tra Audit Log của người quản lý)
  2. **Phân quyền 2 cấp chặt chẽ (RBAC)**:
     - **Chủ sở hữu – Owner (HSN)**: Toàn quyền quản lý hệ thống, bảng doanh thu, đơn giá, tạo/khóa/thu hồi quyền quản lý, phê duyệt điều chỉnh chỉ số bất thường, và xem toàn bộ lịch sử nhập liệu của người quản lý.
     - **Người quản lý – Manager (Nguon Sopheak)**: Đăng nhập bằng tài khoản riêng (mật khẩu được băm SHA-256/hash, không lưu văn bản tĩnh, không dùng chung mật khẩu với Owner); chỉ xem và thao tác trên các phòng được phân quyền; thêm khách thuê mới vào phòng trống; tra cứu khách hiện tại và ghi chỉ số điện/nước hàng tháng; **không thể** xóa dữ liệu gốc, không thể tự ý sửa đơn giá điện/nước/giá phòng/tiền cọc khi chưa được cấp quyền, không thể xóa lịch sử đã lưu.
  3. **Trang riêng "Nguon Sopheak – Bảng điều khiển quản lý"**:
     - Hiển thị thẻ thống kê nhanh (Tổng số phòng được giao, Số khách đang thuê hiện tại, Số bản ghi điện/nước đã nhập trong tháng, Số phòng chưa nhập chỉ số tháng này).
     - 6 phân mục chuyên biệt:
       1. **បន្ទប់ដែលបានកំណត់ / Phòng được chỉ định** (Assigned Rooms)
       2. **អតិថិជនថ្មី / Người thuê nhà mới** (New Tenant Registration – kiểm tra trùng lặp phòng đang có khách, tự động đồng bộ vào danh sách chính HSN và ghi nhận người tạo là `Nguon Sopheak` kèm thời gian thực)
       3. **អតិថិជនចាស់ / Người thuê hiện tại** (Current Tenants Search & Update)
       4. **កត់ត្រាលេខទឹក / Chỉ số đồng hồ nước** (Monthly Water Meter Entry)
       5. **កត់ត្រាលេខភ្លើង / Chỉ số đồng hồ điện** (Monthly Electricity Meter Entry)
       6. **ប្រវត្តិកត់ត្រា / Lịch sử tham gia** (Audit History & Adjustment Requests – không cho phép xóa, hỗ trợ gửi phiếu điều chỉnh có lưu vết khi nhập sai)

- **Target Audience / Persona**:
  - **Chủ sở hữu HENG SAMNANG (HSN)**: Giám sát toàn diện doanh thu, phân quyền cho người quản lý và kiểm toán mọi thay đổi dữ liệu.
  - **Người quản lý Nguon Sopheak**: Thực hiện nghiệp vụ vận hành hàng ngày (nhập khách mới, ghi chỉ số điện/nước hàng tháng) nhanh chóng trên điện thoại và máy tính.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Luồng Đăng Nhập Phân Quyền (Owner vs. Manager vs. Tenant)**:
     - Tab **Admin (Owner HSN)**: Xác thực tài khoản chủ sở hữu HSN, mở toàn bộ tính năng quản trị và mục menu mới **អ្នកគ្រប់គ្រង / Người quản lý**.
     - Tab **Manager (Nguon Sopheak)**: Xác thực bằng tài khoản riêng của Nguon Sopheak (kiểm tra trạng thái tài khoản Active/Locked và mã băm mật khẩu), sau đó mở trực tiếp **Nguon Sopheak – Bảng điều khiển quản lý**.
  2. **Luồng Nhập Chỉ Số Điện & Nước Hàng Tháng Cho Khách Hiện Tại**:
     - Nguon Sopheak chọn phòng (ví dụ `RM-05`) -> Hệ thống tự động truy xuất từ cơ sở dữ liệu chính: Tên khách hiện tại (`ឌិន ចាន់នី`), Mã `Tenant ID`, Chỉ số điện kỳ trước (`elecOld`), Chỉ số nước kỳ trước (`waterOld`), và đơn giá cố định (`1500 ៛/kWh`, `2000 ៛/m³`).
     - Nguon Sopheak chỉ cần nhập **Chỉ số mới** và chọn **Tháng ghi nhận** -> Hệ thống tự động tính:
       - $\text{Điện tiêu thụ} = \text{Chỉ số điện mới} - \text{Chỉ số điện cũ}$
       - $\text{Nước tiêu thụ} = \text{Chỉ số nước mới} - \text{Chỉ số nước cũ}$
       - $\text{Tiền điện} = \text{Điện tiêu thụ} \times \text{Đơn giá điện}$
       - $\text{Tiền nước} = \text{Nước tiêu thụ} \times \text{Đơn giá nước}$
     - Nếu chỉ số mới thấp hơn chỉ số cũ: Hiển thị cảnh báo song ngữ Khmer – Anh/Việt và yêu cầu xác nhận điều chỉnh có ghi lý do vào Nhật ký kiểm tra.
     - Chống tạo bản ghi trùng lặp (Idempotent Upsert theo `roomId + month + year`) khi nhấn Lưu nhiều lần, đồng thời cập nhật tức thì vào bảng hóa đơn/doanh thu của Chủ sở hữu HSN mà vẫn giữ nguyên lịch sử các tháng trước.
  3. **Luồng Nhập Khách Thuê Mới**:
     - Nhập đầy đủ: Họ tên, Số ID, Số điện thoại, Số phòng (`RM-01` – `RM-16`/`RM-17`), Giá thuê tháng, Tiền đặt cọc, Ngày vào ở, Chỉ số điện cũ/mới, Chỉ số nước cũ/mới, Ghi chú.
     - Kiểm tra phòng đang hoạt động: Nếu phòng đã có khách đang ở, hiển thị cảnh báo song ngữ và chặn tạo bản ghi trùng lặp. Nếu hợp lệ, lưu vào cơ sở dữ liệu chính của HSN, gắn nhãn người tạo `Nguon Sopheak` kèm timestamp.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Giữ nguyên bản sắc thương hiệu **HSN Heng Samnang** với tông xanh ngọc lục bảo đậm (`#04170E`, `#0B3C26`, `emerald-800/950`), viền vàng kim (`amber-400`), và chữ trắng sắc nét.
  - **Typography & Hierarchy**: Ưu tiên chữ Khmer (`Moul`, `Kantumruy Pro`) cỡ chữ rõ ràng kết hợp song ngữ Tiếng Anh / Tiếng Việt (có nút chuyển đổi nhanh ngôn ngữ hiển thị `ខ្មែរ / EN` ngay trên thanh điều khiển), các con số tài chính và chỉ số đồng hồ dùng font chữ số thẳng hàng (`font-mono tabular-nums`).
  - **Responsive Layout**: Tối ưu hóa cho cả điện thoại di động (nút bấm $\ge 44\text{px}$, lưới thẻ thống kê tự co giãn) và màn hình máy tính 1440px.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 – Liên kết trực tiếp trên Cơ sở dữ liệu chung (Single Source of Truth)**:
  - *Chosen Approach*: Mọi thao tác của **Nguon Sopheak** đọc và ghi trực tiếp (qua lớp kiểm tra quyền RBAC) vào `savedTenants` và `invoice_history` của HSN, kèm khóa định danh ổn định (`roomId: "RM-05"`, `tenantId: "BKK-P05"`, `recordId: "util-2026-10-RM05"`).
  - *Why*: Đảm bảo khi Nguon Sopheak lưu khách mới hoặc nhập điện/nước tháng mới, Chủ sở hữu HSN thấy ngay kết quả trên Hóa đơn và Báo cáo doanh thu mà không cần nhập lại, tuyệt đối không bị lệch dữ liệu hay tạo vòng lặp.
- **Decision 2 – Bảo mật mật khẩu & Kiểm soát quyền thực thi**:
  - *Chosen Approach*: Lưu mật khẩu tài khoản quản lý dưới dạng mã băm (hash) thay vì văn bản tĩnh; mọi hàm xóa dữ liệu gốc, sửa đơn giá hoặc đổi quyền đều kiểm tra quyền ở tầng logic (`assertOwnerPermission` / `assertManagerPermission`) trước khi ghi vào bộ nhớ hệ thống.
  - *Why*: Ngăn chặn chỉnh sửa hoặc xóa trái phép ngay cả khi thao tác nhanh trên giao diện.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Data Synchronization Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   HSN RENTAL MANAGER - UNIFIED DATA STORE                    │
│  • savedTenants (Room ID RM-01..RM-17, Tenant ID, Old/New Meter Readings)    │
│  • invoice_history (Monthly Utility & Rent Records with Unique Record IDs)   │
│  • manager_accounts (Nguon Sopheak Account, Hashed Credentials, Permissions) │
│  • manager_audit_logs (Immutable Trail: Actor, Timestamp, Before/After Diff) │
└───────────────────┬──────────────────────────────────────┬───────────────────┘
                    │                                      │
      Full Owner RBAC (Read/Write/Admin)     Scoped Manager RBAC (Assigned Rooms)
                    ▼                                      ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────┐
│      OWNER CONSOLE (HENG SAMNANG)     │  │  NGUON SOPHEAK MANAGER DASHBOARD  │
│  • អ្នកគ្រប់គ្រង / Người quản lý        │  │  • KPI Summary Cards & Network    │
│  • បញ្ជីអ្នកគ្រប់គ្រង (Manager List)    │  │  • បន្ទប់ដែលបានកំណត់ (Assigned)   │
│  • ចែករំលែកសិទ្ធិ (Shared Access)      │  │  • អតិថិជនថ្មី (New Tenant Form)   │
│  • Full Invoice, Reports & Revenue    │  │  • អតិថិជនចាស់ (Current Tenants)   │
│  • Full Audit Log & Price Lock Ctrl   │  │  • កត់ត្រាលេខទឹក / ភ្លើង (Meters)  │
└───────────────────────────────────────┘  │  • ប្រវត្តិកត់ត្រា (History & Adj) │
                                           └───────────────────────────────────┘
```

### Data Model & Entities

1. **`ManagerAccount` (`hsn_manager_accounts`)**:
   - `id`: Mã định danh tài khoản (mặc định `'mgr-nguon-sopheak'`).
   - `fullName`: `'Nguon Sopheak'` (`'ងួន សុភ័ក្រ'`).
   - `username`: `'sopheak'` (hoặc `'nguonsopheak'`).
   - `passwordHash`: Mã băm mật khẩu riêng biệt (không lưu plaintext).
   - `status`: `'ACTIVE' | 'LOCKED' | 'REVOKED'`.
   - `assignedRooms`: Danh sách mã phòng được phép quản lý (mặc định `['1'..'17']`).
   - `permissions`: `{ canAddTenant: boolean; canEditTenantInfo: boolean; canEnterUtilities: boolean; canModifyPrices: boolean; canDeleteRecords: boolean }` (mặc định `canModifyPrices: false`, `canDeleteRecords: false`).
2. **`AuditLogEntry` (`hsn_audit_logs`)**:
   - `id`: Mã bản ghi kiểm toán duy nhất.
   - `timestamp`: Thời gian thực hiện (`ISO-8601`).
   - `actorName` & `actorRole`: `'Nguon Sopheak (Manager)'` hoặc `'HENG SAMNANG (Owner)'`.
   - `actionType`: `'ADD_TENANT' | 'UPDATE_TENANT' | 'ENTER_UTILITY' | 'ADJUST_UTILITY' | 'PERMISSION_CHANGE'`.
   - `roomNo` & `tenantId`: Liên kết phòng (`RM-05`) và mã khách (`BKK-P05`).
   - `beforeState` & `afterState`: Giá trị chỉ số điện/nước và thành tiền trước và sau khi cập nhật.
   - `status`: `'SYNCED' | 'ADJUSTED' | 'PENDING_SYNC'`.
3. **Automatic Safe Backup (`hsn_pre_upgrade_backup`)**:
   - Tự động sao lưu toàn bộ `savedTenants` và `invoice_history` hiện có vào kho sao lưu an toàn trước khi ghi bất kỳ thay đổi cấu trúc mới nào.

### Interactive Component & State Mapping

- **Menu Chính (Owner HSN)**: Bổ sung nhóm mục **អ្នកគ្រប់គ្រង / Người quản lý** gồm 3 tab con:
  1. `អ្នកគ្រប់គ្រង / Người quản lý`: Tổng quan hoạt động của Nguon Sopheak, số bản ghi đã nhập trong tháng và trạng thái đồng bộ.
  2. `បញ្ជីអ្នកគ្រប់គ្រង / Danh sách người quản lý`: Quản lý tài khoản Nguon Sopheak và thêm người quản lý mới, cấp lại mật khẩu, khóa/mở khóa.
  3. `ចែករំលែកសិទ្ធិ / Truy cập chia sẻ`: Bảng bật/tắt quyền truy cập từng phòng (`RM-01`..`RM-17`), quyền sửa giá/đặt cọc, và bảng **Nhật ký kiểm tra (Audit Log)** chi tiết.
- **Bảng Điều Khiển Quản Lý Nguon Sopheak**:
  - Bộ chuyển đổi ngôn ngữ nhanh **ខ្មែរ (KH) / English (EN) / Tiếng Việt (VI)** và đèn báo trạng thái kết nối mạng (`Online / Offline Sync Status`).
  - Bộ lọc tìm kiếm khách thuê theo số phòng, tên hoặc số điện thoại.
  - Form ghi chỉ số điện/nước thông minh: Tự động nạp chỉ số cũ từ kỳ trước, khóa ô đơn giá (nếu chưa được Owner cấp quyền `canModifyPrices`), kiểm tra hợp lệ `chỉ số mới >= chỉ số cũ`, chống lưu trùng lặp trong cùng tháng, và cập nhật thẳng vào hóa đơn + bảng doanh thu tháng của Chủ sở hữu HSN.
