"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  reorderDoctors,
  setDoctorVisibility,
} from "@/services/doctorService";
import { useToast } from "@/context/ToastContext";
import useReorder from "@/hooks/useReorder";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ReorderButtons from "@/components/ui/ReorderButtons";
import Avatar from "@/components/ui/Avatar";
import DoctorForm from "@/components/doctors/DoctorForm";
import { assetUrl } from "@/services/apiClient";

export default function DoctorsPage() {
  const toast = useToast();
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  const { move, saving: reordering } = useReorder(doctors, setDoctors, reorderDoctors, toast);

  useEffect(() => {
    getDoctors()
      .then(({ data }) => setDoctors(data))
      .catch((err) => setError(err.message));
  }, [version]);

  const handleSubmit = async (payload) => {
    if (editing._id) await updateDoctor(editing._id, payload);
    else await createDoctor(payload);
    toast(editing._id ? "Doctor updated" : "Doctor added");
    setEditing(null);
    reload();
  };

  const handleToggle = async (doctor) => {
    setToggling(doctor._id);
    try {
      await setDoctorVisibility(doctor._id, !doctor.isActive);
      setDoctors((list) => list.map((d) => (d._id === doctor._id ? { ...d, isActive: !d.isActive } : d)));
      toast(doctor.isActive ? `${doctor.name} hidden from the website` : `${doctor.name} is now visible`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoctor(toDelete._id);
      toast("Doctor removed");
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
      setToDelete(null);
    }
  };

  const addButton = (
    <button type="button" className="btn-primary" onClick={() => setEditing({})}>
      <Icon name="plus" className="h-4 w-4" strokeWidth={2.25} /> Add doctor
    </button>
  );

  const blocked = toDelete?.openAppointmentCount > 0;

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Shown in “Meet our doctors” on the website, in this order, and available to assign to appointments."
        action={addButton}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {!doctors ? (
        !error && <Spinner />
      ) : doctors.length === 0 ? (
        <div className="card">
          <EmptyState icon="user" title="No doctors yet" action={addButton}>
            Introduce your team. A photo is optional; initials are shown without one.
          </EmptyState>
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {doctors.map((doctor, i) => (
            <li key={doctor._id} className="flex items-center gap-3 py-3.5 pr-3 pl-2 sm:gap-4 sm:pr-5 sm:pl-3">
              <ReorderButtons label={doctor.name} index={i} count={doctors.length} onMove={move} disabled={reordering} />
              <Avatar
                src={assetUrl(doctor.photoUrl)}
                alt=""
                name={doctor.name}
                size="h-14 w-12"
                rounded="rounded-lg"
                text="text-sm"
              />
              <div className="min-w-0 flex-1">
                <h2 className={`truncate font-semibold ${doctor.isActive ? "" : "text-muted"}`}>{doctor.name}</h2>
                <p className="truncate text-sm">
                  <span className="font-medium text-brand-700">{doctor.specialty}</span>
                  {doctor.qualifications && <span className="text-muted"> · {doctor.qualifications}</span>}
                </p>
                <Link href={`/appointments?doctor=${doctor._id}`} className="mt-0.5 inline-block text-xs font-medium text-brand-700 hover:underline">
                  {doctor.openAppointmentCount || 0} open · {doctor.appointmentCount || 0} total appointments
                </Link>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={doctor.isActive}
                aria-label={`Show ${doctor.name} on the website`}
                disabled={toggling === doctor._id}
                onClick={() => handleToggle(doctor)}
                className="flex items-center gap-2 rounded-md text-xs font-semibold disabled:opacity-60"
              >
                <span className={`relative h-5 w-9 rounded-full transition-colors ${doctor.isActive ? "bg-brand-600" : "bg-line-strong"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${doctor.isActive ? "translate-x-4" : ""}`} />
                </span>
                <span className={`hidden w-12 text-left sm:inline ${doctor.isActive ? "text-brand-700" : "text-muted"}`}>
                  {doctor.isActive ? "Visible" : "Hidden"}
                </span>
              </button>
              <div className="flex shrink-0 gap-0.5">
                <button type="button" className="icon-btn" onClick={() => setEditing(doctor)} aria-label={`Edit ${doctor.name}`} title="Edit">
                  <Icon name="edit" className="h-[1.125rem] w-[1.125rem]" />
                </button>
                <button
                  type="button"
                  className="icon-btn hover:bg-danger-bg hover:text-danger"
                  onClick={() => setToDelete(doctor)}
                  aria-label={`Remove ${doctor.name}`}
                  title="Remove"
                >
                  <Icon name="trash" className="h-[1.125rem] w-[1.125rem]" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!editing}
        title={editing?._id ? "Edit doctor" : "Add doctor"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="doctor-form" className="btn-primary">
              Save doctor
            </button>
          </>
        }
      >
        {editing && <DoctorForm id="doctor-form" initial={editing} onSubmit={handleSubmit} />}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title={blocked ? "This doctor has open appointments" : "Remove this doctor?"}
        message={
          toDelete &&
          (blocked
            ? `${toDelete.name} has ${toDelete.openAppointmentCount} pending or confirmed appointment${toDelete.openAppointmentCount === 1 ? "" : "s"}. Reassign them first, or hide the doctor from the website.`
            : `${toDelete.name} will be removed from the website. Past appointments stay, without a doctor assigned.`)
        }
        confirmLabel={blocked ? (toDelete.isActive ? "Hide doctor" : "OK") : "Remove"}
        tone={blocked ? "primary" : "danger"}
        onConfirm={
          blocked
            ? async () => {
                if (toDelete.isActive) await handleToggle(toDelete);
                setToDelete(null);
              }
            : handleDelete
        }
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
