"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServices, createService, updateService, deleteService, reorderServices } from "@/services/serviceService";
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
import ServiceIcon from "@/components/ui/ServiceIcon";
import ServiceForm from "@/components/services/ServiceForm";

function VisibilitySwitch({ service, onToggle, busy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={service.isActive}
      aria-label={`Show ${service.title} on the website`}
      disabled={busy}
      onClick={() => onToggle(service)}
      className="group flex items-center gap-2 rounded-md text-xs font-semibold disabled:opacity-60"
      title={service.isActive ? "Visible on the website" : "Hidden from the website"}
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${service.isActive ? "bg-brand-600" : "bg-line-strong"}`}>
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${service.isActive ? "translate-x-4" : ""}`} />
      </span>
      <span className={`hidden w-12 text-left sm:inline ${service.isActive ? "text-brand-700" : "text-muted"}`}>
        {service.isActive ? "Visible" : "Hidden"}
      </span>
    </button>
  );
}

export default function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  const { move, saving: reordering } = useReorder(services, setServices, reorderServices, toast);

  useEffect(() => {
    getServices()
      .then(({ data }) => setServices(data))
      .catch((err) => setError(err.message));
  }, [version]);

  const handleSubmit = async (payload) => {
    if (editing._id) await updateService(editing._id, payload);
    else await createService(payload);
    toast(editing._id ? "Service updated" : "Service added");
    setEditing(null);
    reload();
  };

  const handleToggle = async (service) => {
    setToggling(service._id);
    try {
      await updateService(service._id, { isActive: !service.isActive });
      setServices((list) => list.map((s) => (s._id === service._id ? { ...s, isActive: !s.isActive } : s)));
      toast(service.isActive ? `“${service.title}” hidden from the website` : `“${service.title}” is now visible`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteService(toDelete._id);
      toast("Service deleted");
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
      setToDelete(null);
    }
  };

  const addButton = (
    <button type="button" className="btn-primary" onClick={() => setEditing({})}>
      <Icon name="plus" className="h-4 w-4" strokeWidth={2.25} /> Add service
    </button>
  );

  return (
    <>
      <PageHeader
        title="Services"
        description="Shown on the website and in the booking form, in this order. Changes go live straight away."
        action={addButton}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {!services ? (
        !error && <Spinner />
      ) : services.length === 0 ? (
        <div className="card">
          <EmptyState icon="pulse" title="No services yet" action={addButton}>
            Add the services patients can book. They appear on the website straight away.
          </EmptyState>
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {services.map((service, i) => (
            <li key={service._id} className="flex items-center gap-3 py-3.5 pr-3 pl-2 sm:gap-4 sm:pr-5 sm:pl-3">
              <ReorderButtons label={service.title} index={i} count={services.length} onMove={move} disabled={reordering} />
              <ServiceIcon name={service.icon} className={`h-11 w-11 ${service.isActive ? "" : "opacity-50 grayscale"}`} />
              <div className="min-w-0 flex-1">
                <h2 className={`truncate font-semibold ${service.isActive ? "" : "text-muted"}`}>{service.title}</h2>
                <p className="truncate text-sm text-muted">{service.description}</p>
                <Link
                  href={`/appointments?service=${service._id}`}
                  className="mt-0.5 inline-block text-xs font-medium text-brand-700 hover:underline"
                >
                  {service.appointmentCount || 0} appointment{service.appointmentCount === 1 ? "" : "s"}
                </Link>
              </div>
              <VisibilitySwitch service={service} onToggle={handleToggle} busy={toggling === service._id} />
              <div className="flex shrink-0 gap-0.5">
                <button type="button" className="icon-btn" onClick={() => setEditing(service)} aria-label={`Edit ${service.title}`} title="Edit">
                  <Icon name="edit" className="h-[1.125rem] w-[1.125rem]" />
                </button>
                <button
                  type="button"
                  className="icon-btn hover:bg-danger-bg hover:text-danger"
                  onClick={() => setToDelete(service)}
                  aria-label={`Delete ${service.title}`}
                  title={service.appointmentCount ? "Has appointments; hide it instead" : "Delete"}
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
        title={editing?._id ? "Edit service" : "Add service"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="service-form" className="btn-primary">
              Save service
            </button>
          </>
        }
      >
        {editing && <ServiceForm id="service-form" initial={editing} onSubmit={handleSubmit} />}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this service?"
        message={
          toDelete &&
          (toDelete.appointmentCount
            ? `“${toDelete.title}” has ${toDelete.appointmentCount} appointment${toDelete.appointmentCount === 1 ? "" : "s"}, so it can't be deleted without losing that history. ${toDelete.isActive ? "Hide it from the website instead?" : "It is already hidden from the website."}`
            : `“${toDelete.title}” will be removed from the website and the booking form.`)
        }
        confirmLabel={toDelete?.appointmentCount ? (toDelete.isActive ? "Hide service" : "OK") : "Delete"}
        tone={toDelete?.appointmentCount ? "primary" : "danger"}
        onConfirm={
          toDelete?.appointmentCount
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
