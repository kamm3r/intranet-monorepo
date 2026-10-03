import { Effect } from "effect"
import mongoose from "mongoose"

mongoose.set("strictQuery", true)

/**
 * Connect to MongoDB, logging success/failure like the original.
 * Connection failures are logged (not thrown) so the server still starts,
 * preserving the legacy behaviour.
 */
export const connectMongooseEffect = (mongoUrl: string): Effect.Effect<void> =>
  Effect.zipRight(
    Effect.sync(() => {
      console.log("connecting to MongoDB")
    }),
    Effect.tryPromise({
      try: () =>
        mongoose.connect(mongoUrl).then((): void => {
          undefined
        }),
      catch: (error) => error
    }).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          console.log("connected to databases", mongoUrl)
        })
      ),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.log("connecting to MongoDB failed", error)
        })
      )
    )
  )

export default connectMongooseEffect
