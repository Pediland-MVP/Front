import React from "react";

type DataItem = {
  title: string; 
  text: string;  
  button:boolean;
};

type InlineBoxProps = {
  data: DataItem[]; // Array of data items
};

export default function InlineBox({ data }: InlineBoxProps) {
  return (
    <div className="md:px-8 px-4 xl:px-0 mx-auto flex flex-col md:flex-row max-w-[80rem] w-full mt-8 gap-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="w-full p-6 bg-purple-100 rounded-2xl" 
        >
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <p className="mt-2 text-lg">{item.text}</p>
        </div>
      ))}
    </div>
  );
}
