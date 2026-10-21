const timeLabels = {
  reception: 'وقت الاستقبال',
  ceremony: 'وقت عقد القران / الخطوبة',
  dinner: 'وقت العشاء',
  party: 'وقت الحفلة',
};
const timezones = [
  ['Africa/Cairo', 'القاهرة — مصر'],
  ['Africa/Casablanca', 'الدار البيضاء — المغرب'],
  ['Asia/Riyadh', 'الرياض — السعودية'],
  ['Asia/Dubai', 'دبي — الإمارات'],
  ['Europe/Paris', 'باريس — فرنسا'],
  ['Europe/London', 'لندن — المملكة المتحدة'],
  ['America/New_York', 'نيويورك — الولايات المتحدة'],
];
const sections = [
  ['countdown', 'العداد التنازلي'],
  ['timeline', 'جدول أوقات الحفلة'],
  ['dressCode', 'الزي المقترح (Dress Code)'],
  ['rsvp', 'تأكيد الحضور (RSVP)'],
  ['showMap', 'خريطة جوجل'],
  ['music', 'موسيقى الدعوة'],
];

function TextField({ label, name, config, onChange, ...props }) {
  return (
    <label>
      {label}
      <input name={name} value={config[name]} onChange={onChange} {...props} />
    </label>
  );
}

function Choices({ name, values, value, onChange, className = '' }) {
  return (
    <div className={`pills ${className}`}>
      {values.map(([key, label]) => (
        <label key={key}>
          <input type="radio" name={name} value={key} checked={value === key} onChange={onChange} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

export default function EditorForm({ config, id, saving, status, onChange, onSubmit }) {
  const fieldProps = { config, onChange };
  return (
    <form id="editor-form" onSubmit={onSubmit}>
      <fieldset>
        <legend>نوع المناسبة</legend>
        <Choices
          name="eventType"
          values={[
            ['wedding', 'فرح'],
            ['engagement', 'خطوبة'],
          ]}
          value={config.eventType}
          onChange={onChange}
        />
      </fieldset>
      <fieldset>
        <legend>لغة الدعوة</legend>
        <Choices
          name="language"
          className="language"
          values={[
            ['en', 'English'],
            ['ar', 'عربي'],
            ['fr', 'Français'],
          ]}
          value={config.language}
          onChange={onChange}
        />
      </fieldset>
      <fieldset>
        <legend>أسماء العروسين</legend>
        <div className="field-grid">
          <TextField
            {...fieldProps}
            label="اسم العريس (بالحروف اللاتينية)"
            name="groom"
            required
            maxLength={150}
            placeholder="Yusuf"
            autoComplete="off"
          />
          <TextField
            {...fieldProps}
            label="اسم العروسة (بالحروف اللاتينية)"
            name="bride"
            required
            maxLength={150}
            placeholder="Amira"
            autoComplete="off"
          />
          <TextField
            {...fieldProps}
            label="اسم العريس بالعربي"
            name="groomAr"
            maxLength={150}
            placeholder="يوسف"
          />
          <TextField
            {...fieldProps}
            label="اسم العروسة بالعربي"
            name="brideAr"
            maxLength={150}
            placeholder="أميرة"
          />
        </div>
      </fieldset>
      <fieldset>
        <legend>المكان والتاريخ</legend>
        <TextField
          {...fieldProps}
          label="اسم القاعة / المكان"
          name="venue"
          required
          maxLength={150}
          placeholder="Beldi Country Club"
        />
        <TextField
          {...fieldProps}
          label="المدينة"
          name="city"
          required
          maxLength={150}
          placeholder="Marrakech, Morocco"
        />
        <TextField {...fieldProps} label="تاريخ الحفلة" type="date" name="date" required />
        <TextField
          {...fieldProps}
          label="لينك جوجل مابس أو عنوان القاعة (اختياري)"
          name="map"
          maxLength={1000}
          placeholder="الصق لينك خرائط جوجل، أو اكتب اسم / عنوان المكان"
        />
        <p className="field-help">
          تقدر تلصق أي لينك من جوجل مابس زي ما هو، أو تكتب اسم المكان بس. لو سبته فاضي هنستخدم اسم
          القاعة + المدينة.
        </p>
      </fieldset>
      <fieldset>
        <legend>جدول أوقات الحفلة</legend>
        <div className="field-grid" id="time-fields">
          {Object.entries(timeLabels).map(([name, label]) => (
            <label key={name}>
              {label}
              <input type="time" name={name} value={config[name]} onChange={onChange} required={name !== 'ceremony'} step="60" />
            </label>
          ))}
        </div>
        <p className="field-help">وقت عقد القران اختياري — اتركه فارغًا لإخفائه من البرنامج.</p>
        <label className="timezone-label">
          التوقيت المحلي للحفلة
          <select name="timezone" value={config.timezone} onChange={onChange}>
            {timezones.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset className="visibility-fields">
        <legend>أقسام تقدر تشيلها من الدعوة لو مش عايزها</legend>
        {sections.map(([name, label]) => (
          <label key={name}>
            <input type="checkbox" name={name} checked={config[name]} onChange={onChange} /> {label}
          </label>
        ))}
      </fieldset>
      <details className="extra-settings">
        <summary>
          لمستك الخاصة <span>＋</span>
        </summary>
        <label>
          رسالة الدعوة (اختياري)
          <textarea
            name="greeting"
            maxLength={1000}
            rows={3}
            placeholder="سيبها فاضية لاستخدام النص الأصلي باللغة المختارة"
            value={config.greeting}
            onChange={onChange}
          />
        </label>
        <label>
          الزي المقترح للسيدات (اختياري)
          <textarea
            name="ladies"
            maxLength={1000}
            rows={2}
            value={config.ladies}
            onChange={onChange}
          />
        </label>
        <label>
          الزي المقترح للسادة (اختياري)
          <textarea
            name="gentlemen"
            maxLength={1000}
            rows={2}
            value={config.gentlemen}
            onChange={onChange}
          />
        </label>
      </details>
      <p className="form-message" id="save-status" role="status">
        {status}
      </p>
      <button className="primary-button" id="save-button" type="submit" disabled={saving}>
        {id ? 'حفظ التغييرات' : 'إنشاء الدعوة'} <span>←</span>
      </button>
      <p className="save-note">تفاصيلك بتتحفظ على جهازك · تقدر ترجع تعدّلها في أي وقت</p>
    </form>
  );
}
