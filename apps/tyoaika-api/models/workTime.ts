import mongoose from "mongoose"

export interface WorkTimeAttrs {
  name?: string | undefined
  arrival: Date
  departure?: Date | undefined
}

const workTimeSchema = new mongoose.Schema<WorkTimeAttrs>({
  name: String,
  arrival: {
    type: Date,
    required: true
  },
  departure: {
    type: Date
  }
})

export const WorkTime = mongoose.model<WorkTimeAttrs>("WorkTime", workTimeSchema)
