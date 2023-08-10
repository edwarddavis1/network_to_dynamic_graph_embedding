# %%
import plotly.express as px
import pandas as pd
import networkx as nx
import plotly.graph_objs as go
import plotly.offline as pyo
from embedding_functions import *
from experiment_setup import *
from plotly.subplots import make_subplots

# %%


@nb.njit()
def make_dynamic_network(n, T=2, move_prob=0.4, K=2):
    # Ensure equal community sizes
    if n % K != 0:
        raise ValueError("n must be divisible by the number of communities")

    tau = np.repeat(np.arange(0, K), int(n / K))
    np.random.shuffle(tau)

    # Generate B matrices
    B_list = np.zeros((T, K, K))

    move_amount = np.abs(move_prob - 0.5)
    comm_probs = np.linspace(0.1, 0.9, K)

    # comm_probs = np.random.uniform(0.1, 0.9, K)

    for t in range(T):
        # comm_to_change = np.random.choice(np.arange(0, K))
        comm_to_change = t % K

        # B_for_change = B_for_time.copy()
        # B_for_change[1, 1] = B_for_change[1, 1] + move_amount

        B_for_change = np.ones((K, K)) * 0.5
        np.fill_diagonal(B_for_change, comm_probs)

        if B_for_change[comm_to_change, comm_to_change] < 1 - move_amount:
            B_for_change[comm_to_change, comm_to_change] = (
                B_for_change[comm_to_change, comm_to_change] + move_amount
            )
        else:
            B_for_change[comm_to_change, comm_to_change] = (
                B_for_change[comm_to_change, comm_to_change] - move_amount
            )

        B_list[t] = B_for_change

    # Generate adjacency matrices
    As = np.zeros((T, n, n))
    for t in range(T):
        P_t = np.zeros((n, n))
        for i in range(n):
            P_t[:, i] = B_list[t][tau, tau[i]]

        A_t = np.random.uniform(0, 1, n**2).reshape((n, n)) < P_t
        As[t] = A_t

    return (As, tau)


# %%
K = 4
n = K * 50
T = K
As, tau = make_dynamic_network(n, T=T, move_prob=0.3, K=K)
# %%
plot_embedding(embed(As, 2, method="UASE"), n, T, tau)

ya = embed(As, 2, method="UASE")


# %%
df = pd.DataFrame(
    {
        "x_emb": ya[:, 0],
        "y_emb": ya[:, 1],
        "t": np.repeat(np.arange(0, T), n),
        "tau": np.tile(tau, T),
        "id": np.tile(np.arange(0, n), T),
    }
)
# %%
# save
df.to_csv("data/dynamic_embedding_df.csv")

from networkx.readwrite import json_graph
import json

G_list = []
for t in range(T):
    G = nx.from_numpy_array(As[t])
    G_list.append(G)

# Save json graph
for i, G in enumerate(G_list):
    # Convert tau_for_graphs to a list of ints
    # Set tau as a node attribute
    nx.set_node_attributes(G, dict(zip(G.nodes(), tau.astype(int).tolist())), "tau")
    # Save graph as a JSON file
    with open(f"data/graph_t={i}.json", "w") as f:
        json.dump(json_graph.node_link_data(G), f)


# save spring layout positions
for t in range(T):
    G = G_list[t]
    pos = nx.spring_layout(G)

    # Save the spring layout positions of the nodes and edge in a dataframe format, similar to how we saved ya for each graph in graph_list
    pos_df = pd.DataFrame.from_dict(pos, orient="index")
    pos_df.columns = ["x", "y"]
    pos_df["id"] = pos_df.index
    pos_df["t"] = t
    pos_df["tau"] = tau
    pos_df.to_csv("data/pos_df_t={}.csv".format(t))

# %%

# %%
df = pd.read_csv("data/dynamic_embedding_df.csv")

# %%
fig = px.scatter(
    df,
    x="x_emb",
    y="y_emb",
    animation_frame="t",
    color="tau",
    range_x=[-1, 1],
    range_y=[-1, 1],
)
fig

# %%
# plot graph list 0 with networkx
