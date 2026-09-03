"use client";
import { useParams } from "next/navigation";
import DriveApp from "../../../../components/DriveApp";
export default function FolderPage(){ const params = useParams<{id:string}>(); return <DriveApp mode="drive" folderId={params.id}/>; }
