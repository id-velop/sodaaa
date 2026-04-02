# GridTrackSize

**Source:** https://developers.figma.com/docs/plugins/api/GridTrackSize/

---

On this page

## GridTrackSize[​](#gridtracksize "Direct link to GridTrackSize")

### value?: number

Applicable only on FIXED grid tracks. The size of the track in pixels.
Optional for `FLEX` tracks.
If the setter for this value is called on a `FLEX` track, the track will be converted to a `FIXED` track.

---

### type: 'FLEX' | 'FIXED'

The type of the grid track. `FLEX` indicates that the track will grow to fill the available space in the container (evenly divided among all flex tracks in the grid), while `FIXED` indicates that the track will have a fixed size.

---

- [GridTrackSize](#gridtracksize)