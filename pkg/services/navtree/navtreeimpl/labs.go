package navtreeimpl

import "github.com/grafana/grafana/pkg/services/navtree"

func (s *ServiceImpl) buildLabsNavLink() *navtree.NavLink {
	return &navtree.NavLink{
		Id:         navtree.NavIDLabs,
		Text:       "Labs",
		SubTitle:   "View enabled feature flags",
		Icon:       "rocket",
		Url:        s.cfg.AppSubURL + "/labs",
		SortWeight: navtree.WeightLabs,
		IsNew:      true,
	}
}
