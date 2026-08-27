export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        error: "Départ et destination sont obligatoires."
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Google Maps API key not configured."
      });
    }

    const url =
      "https://maps.googleapis.com/maps/api/directions/json" +
      "?origin=" + encodeURIComponent(from) +
      "&destination=" + encodeURIComponent(to) +
      "&mode=driving" +
      "&language=fr" +
      "&key=" + encodeURIComponent(apiKey);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.routes?.length) {
      return res.status(400).json({
        error: "Trajet introuvable.",
        details: data.status
      });
    }

    const leg = data.routes[0].legs[0];

    const distanceKm = leg.distance.value / 1000;
    const durationMinutes = Math.ceil(leg.duration.value / 60);

    return res.status(200).json({
      from: leg.start_address,
      to: leg.end_address,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes,
      distanceText: leg.distance.text,
      durationText: leg.duration.text
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur.",
      details: error.message
    });
  }
}
