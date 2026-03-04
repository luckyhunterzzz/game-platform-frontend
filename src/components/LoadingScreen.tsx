'use client';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
      <div className="relative flex items-center justify-center">
        <div className="absolute animate-ping h-20 w-20 rounded-full bg-blue-500/20"></div>
        <div className="relative h-16 w-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
      
      <h2 className="mt-8 text-xl font-bold tracking-[0.2em] text-blue-400 animate-pulse uppercase">
        Connecting...
      </h2>
      <p className="mt-2 text-slate-500 text-sm font-light">Authenticating session</p>
    </div>
  );
};