import React from 'react';

type Feature = {
    title: string;
    text: string;
  };
  
  type FeatureBoxProps = {
    features: Feature[];
  };
  
  export default function FeatureBox({ features }: FeatureBoxProps) {
  
  return (
    <div className="max-w-[80rem] mx-auto md:px-8 px-4 xl:px-0 ">
        <h2 className='px-6 py-10 text-xl font-semibold'>لورم اپیوزوم اپیزوم </h2>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="bg-purple-100 p-12 rounded-2xl">
            <h3 className="text-xl font-bold mb-2 text-blueKommo">{feature.title}</h3>
            <p className="text-blueKommo">{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
