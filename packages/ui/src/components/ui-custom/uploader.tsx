import { UploadSimple } from '@phosphor-icons/react/dist/ssr/UploadSimple';
import React, { useState } from 'react';

const FileUploader: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // بررسی وجود فایل
    if (file) {
      setFileName(file.name); // ذخیره نام فایل در state
    } else {
      setFileName(''); // اگر فایل انتخاب نشد
    }
  };

  return (
    <div className="group flex h-36 w-full flex-col items-center justify-center rounded-md border border-dashed border-gray-200 duration-300 hover:border-sky-200 hover:bg-sky-50/50">
      <label
        htmlFor="picture"
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-md"
      >
        {fileName ? (
          <p className="text-muted-foreground text-center text-sm">
            فایل انتخاب شده: <span className="font-medium">{fileName}</span>
            <br />
            <span className="text-xs font-light">جهت تغییر فایل دوباره اینجا کلیک کنید.</span>
          </p>
        ) : (
          <UploadSimple
            size={36}
            className="text-muted-foreground duration-300 group-hover:text-blue-300"
            weight="light"
          />
        )}
      </label>
      <input id="picture" type="file" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

export default FileUploader;
