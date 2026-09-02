package navtreeimpl

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/setting"
)

func TestBuildLabsNavLink(t *testing.T) {
	service := ServiceImpl{
		cfg: setting.NewCfg(),
	}

	link := service.buildLabsNavLink()
	require.NotNil(t, link)
	require.Equal(t, navtree.NavIDLabs, link.Id)
	require.Equal(t, "Labs", link.Text)
	require.Equal(t, "View enabled feature flags", link.SubTitle)
	require.Equal(t, "rocket", link.Icon)
	require.Equal(t, "/labs", link.Url)
	require.Equal(t, int64(navtree.WeightLabs), link.SortWeight)
	require.True(t, link.IsNew)
}
