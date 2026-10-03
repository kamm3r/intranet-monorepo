import mongoose, { Document, Model, Schema } from "mongoose"

export interface BookingDocument extends Document {
  topic: string
  name: string
  createdBy?: string
  selectedDate: Date
  selectedTime: Array<string>
  endingTime: string
  createdAt: Date
  updatedAt: Date
}

type BookingModel = Model<BookingDocument>

const bookingSchema = new Schema<BookingDocument, BookingModel>(
  {
    topic: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    createdBy: { type: String, index: true },
    selectedDate: {
      type: Date,
      required: true
    },
    selectedTime: {
      type: [String],
      required: true
    },
    endingTime: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
)
bookingSchema.index({ selectedDate: 1, selectedTime: 1 }, { unique: true })

export const Booking = mongoose.model<BookingDocument, BookingModel>("Booking", bookingSchema)

export default Booking
