import Dashboard from "@/components/Dashboard";
import Sidebar from "@/components/Navbar";
import React from "react";

const page = () => {
  return (
    <div className="w-full flex justify-between  ">
      <div className="w-[10%]">
        <Sidebar />
      </div>
      <div className=" min-h-screen w-[110%] ml-10 flex flex-col">
        <main className="flex-1 p-3">
          <Dashboard />
        </main>
      </div>
    </div>
  );
};

export default page;
