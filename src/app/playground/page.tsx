"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  ScoreBadge,
  Spinner,
} from "@/components/ui";

export default function PlaygroundPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col gap-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">UI Playground</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              Temporary surface to sanity-check primitives.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="transition-transform duration-150 hover:scale-[1.005]">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Primary, ghost, destructive.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-transform duration-150 hover:scale-[1.005]">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>Standard form fields.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Input placeholder="Job title" />
                <Input placeholder="Department" />
                <Input placeholder="Location" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="transition-transform duration-150 hover:scale-[1.005]">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Score-based variants.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <ScoreBadge score={82} />
                <ScoreBadge score={64} />
                <ScoreBadge score={31} />
                <Badge>Draft</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-transform duration-150 hover:scale-[1.005]">
            <CardHeader>
              <CardTitle>Spinner</CardTitle>
              <CardDescription>Loading indicator.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <Spinner />
                <Spinner size="lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-transform duration-150 hover:scale-[1.005]">
            <CardHeader>
              <CardTitle>Layout sample</CardTitle>
              <CardDescription>Recruiter dashboard teaser.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-sm text-[--text-secondary]">
                <div className="flex items-center justify-between">
                  <span>Total Jobs</span>
                  <span className="text-[--text-primary]">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending Review</span>
                  <span className="text-[--text-primary]">34</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Scheduled</span>
                  <span className="text-[--text-primary]">6</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite to interview"
        description="This action will email the candidate and unlock the mock interview."
      >
        <div className="flex flex-col gap-4">
          <Input placeholder="Proposed time" />
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Send invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
